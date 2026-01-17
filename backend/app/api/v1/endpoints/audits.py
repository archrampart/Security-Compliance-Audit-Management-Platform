from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.audit import Audit, AuditStatus
from app.models.project import Project
from app.models.template import Template, TemplateItem
from app.models.finding import Finding
from app.models.user import User, UserRole
from app.schemas.audit import Audit as AuditSchema, AuditCreate, AuditUpdate
from app.core.dependencies import get_current_user
from app.core.activity_logger import log_activity
from app.core.notification_service import create_notification
from app.models.notification import NotificationType

router = APIRouter()

def check_project_access(user: User, project_id: int, db: Session):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if user.role == UserRole.PLATFORM_ADMIN:
        return project
    elif user.role == UserRole.ORG_ADMIN:
        if project.organization_id != user.organization_id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
        return project
    else:
        # Auditor can only access assigned projects
        project_ids = [pu.project_id for pu in user.project_assignments]
        if project_id not in project_ids:
            raise HTTPException(status_code=403, detail="Not enough permissions")
        return project

@router.post("/", response_model=AuditSchema, status_code=status.HTTP_201_CREATED)
def create_audit(
    audit: AuditCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check project access
    project = check_project_access(current_user, audit.project_id, db)
    
    db_audit = Audit(
        name=audit.name,
        description=audit.description,
        standard=audit.standard,
        project_id=audit.project_id,
        audit_date=audit.audit_date,
        status=audit.status,
        language=audit.language or "tr"
    )
    db.add(db_audit)
    db.flush()
    
    # Log activity
    log_activity(
        db=db,
        entity_type="audit",
        entity_id=db_audit.id,
        action="created",
        user_id=current_user.id,
        details={"name": db_audit.name, "standard": db_audit.standard.value, "status": db_audit.status.value}
    )
    
    # Create findings from template if provided
    if audit.template_id:
        from app.core.i18n import get_template_field
        template = db.query(Template).filter(Template.id == audit.template_id).first()
        if template:
            # Get language from request (default to 'tr')
            lang = audit.language if audit.language else "tr"
            # Ensure lang is either 'tr' or 'en'
            if lang not in ["tr", "en"]:
                lang = "tr"
            
            # Debug: Log the language being used
            import logging
            logger = logging.getLogger(__name__)
            logger.info(f"Creating findings from template {audit.template_id} with language: {lang}")
            
            findings_count = 0
            for item in template.items:
                finding = Finding(
                    audit_id=db_audit.id,
                    title=get_template_field(item, "default_title", lang),
                    description=get_template_field(item, "default_description", lang),
                    control_reference=item.control_reference,
                    severity=item.default_severity,
                    status=item.default_status,
                    recommendation=get_template_field(item, "default_recommendation", lang)
                )
                db.add(finding)
                findings_count += 1
            
            # Log template findings creation
            log_activity(
                db=db,
                entity_type="audit",
                entity_id=db_audit.id,
                action="findings_created_from_template",
                user_id=current_user.id,
                details={"template_id": audit.template_id, "findings_count": findings_count}
            )
    
    db.commit()
    db.refresh(db_audit)
    return db_audit

@router.get("/", response_model=List[AuditSchema])
def read_audits(
    skip: int = 0,
    limit: int = 100,
    project_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Audit)
    
    if project_id:
        check_project_access(current_user, project_id, db)
        query = query.filter(Audit.project_id == project_id)
    else:
        # Filter by accessible projects
        if current_user.role == UserRole.PLATFORM_ADMIN:
            pass  # See all
        elif current_user.role == UserRole.ORG_ADMIN:
            project_ids = [p.id for p in db.query(Project).filter(Project.organization_id == current_user.organization_id).all()]
            query = query.filter(Audit.project_id.in_(project_ids))
        else:
            project_ids = [pu.project_id for pu in current_user.project_assignments]
            query = query.filter(Audit.project_id.in_(project_ids))
    
    audits = query.offset(skip).limit(limit).all()
    return audits

@router.get("/{audit_id}", response_model=AuditSchema)
def read_audit(
    audit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    check_project_access(current_user, audit.project_id, db)
    return audit

@router.put("/{audit_id}", response_model=AuditSchema)
def update_audit(
    audit_id: int,
    audit: AuditUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not db_audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    check_project_access(current_user, db_audit.project_id, db)
    
    update_data = audit.dict(exclude_unset=True)
    old_status = db_audit.status
    
    changes = {}
    for field, value in update_data.items():
        old_value = getattr(db_audit, field, None)
        if old_value != value:
            changes[field] = {"old": str(old_value), "new": str(value)}
            setattr(db_audit, field, value)
    
    # Log activity
    if changes:
        log_activity(
            db=db,
            entity_type="audit",
            entity_id=db_audit.id,
            action="updated",
            user_id=current_user.id,
            details={"changes": changes}
        )
        
        # Create notification if status changed
        if "status" in changes:
            new_status = update_data.get("status")
            # Notify project users about status change
            from app.models.project import ProjectUser
            project_users = db.query(ProjectUser).filter(ProjectUser.project_id == db_audit.project_id).all()
            for project_user in project_users:
                if project_user.user_id != current_user.id:
                    create_notification(
                        db=db,
                        user_id=project_user.user_id,
                        notification_type=NotificationType.AUDIT_STATUS_CHANGED,
                        title="Denetim Durumu Değişti",
                        message=f'"{db_audit.name}" denetiminin durumu "{new_status.value}" olarak güncellendi',
                        related_entity_type="audit",
                        related_entity_id=db_audit.id
                    )
    
    db.commit()
    db.refresh(db_audit)
    return db_audit

@router.delete("/{audit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_audit(
    audit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not db_audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    check_project_access(current_user, db_audit.project_id, db)
    
    audit_name = db_audit.name
    
    # Log activity before deletion
    log_activity(
        db=db,
        entity_type="audit",
        entity_id=audit_id,
        action="deleted",
        user_id=current_user.id,
        details={"name": audit_name}
    )
    
    db.delete(db_audit)
    db.commit()
    return None

@router.post("/{audit_id}/copy", response_model=AuditSchema, status_code=status.HTTP_201_CREATED)
def copy_audit(
    audit_id: int,
    new_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    source_audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not source_audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    check_project_access(current_user, source_audit.project_id, db)
    
    # Create new audit
    new_audit = Audit(
        name=new_name,
        description=source_audit.description,
        standard=source_audit.standard,
        project_id=source_audit.project_id,
        audit_date=source_audit.audit_date,
        status=AuditStatus.PLANNING  # New audit starts in planning
    )
    db.add(new_audit)
    db.flush()
    
    # Log activity
    log_activity(
        db=db,
        entity_type="audit",
        entity_id=new_audit.id,
        action="copied",
        user_id=current_user.id,
        details={"source_audit_id": audit_id, "source_name": source_audit.name}
    )
    
    # Copy findings
    findings_count = 0
    for finding in source_audit.findings:
        new_finding = Finding(
            audit_id=new_audit.id,
            title=finding.title,
            description=finding.description,
            control_reference=finding.control_reference,
            severity=finding.severity,
            status=finding.status,
            recommendation=finding.recommendation,
            assigned_to_user_id=finding.assigned_to_user_id,
            due_date=finding.due_date
        )
        db.add(new_finding)
        findings_count += 1
    
    # Log findings copy
    if findings_count > 0:
        log_activity(
            db=db,
            entity_type="audit",
            entity_id=new_audit.id,
            action="findings_copied",
            user_id=current_user.id,
            details={"findings_count": findings_count}
        )
    
    db.commit()
    db.refresh(new_audit)
    return new_audit

