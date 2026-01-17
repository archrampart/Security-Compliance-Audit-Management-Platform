from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
import os
import uuid
from app.db.database import get_db
from app.models.finding import Finding, Evidence, FindingComment
from app.models.audit import Audit
from app.models.user import User, UserRole
from app.schemas.finding import (
    Finding as FindingSchema, 
    FindingCreate, 
    FindingUpdate, 
    Evidence as EvidenceSchema, 
    EvidenceCreate,
    FindingComment as FindingCommentSchema,
    FindingCommentCreate
)
from app.core.dependencies import get_current_user
from app.core.config import settings
from app.core.activity_logger import log_activity
from app.core.notification_service import create_notification
from app.models.notification import NotificationType

router = APIRouter()

def check_audit_access(user: User, audit_id: int, db: Session):
    audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    from app.models.project import Project
    project = db.query(Project).filter(Project.id == audit.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if user.role == UserRole.PLATFORM_ADMIN:
        return audit
    elif user.role == UserRole.ORG_ADMIN:
        if project.organization_id != user.organization_id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
        return audit
    else:
        # Auditor can only access assigned projects
        project_ids = [pu.project_id for pu in user.project_assignments]
        if audit.project_id not in project_ids:
            raise HTTPException(status_code=403, detail="Not enough permissions")
        return audit

@router.post("/", response_model=FindingSchema, status_code=status.HTTP_201_CREATED)
def create_finding(
    finding: FindingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_audit_access(current_user, finding.audit_id, db)
    
    finding_data = finding.dict()
    assigned_to_user_id = finding_data.pop('assigned_to_user_id', None)
    
    db_finding = Finding(**finding_data)
    if assigned_to_user_id:
        db_finding.assigned_to_user_id = assigned_to_user_id
    db.add(db_finding)
    db.flush()
    
    # Log activity
    log_activity(
        db=db,
        entity_type="finding",
        entity_id=db_finding.id,
        action="created",
        user_id=current_user.id,
        details={"title": db_finding.title, "severity": db_finding.severity.value}
    )
    
    # Create notification if assigned
    if assigned_to_user_id and assigned_to_user_id != current_user.id:
        create_notification(
            db=db,
            user_id=assigned_to_user_id,
            notification_type=NotificationType.FINDING_ASSIGNED,
            title="Yeni Bulgu Atandı",
            message=f'"{db_finding.title}" bulgusu size atandı',
            related_entity_type="finding",
            related_entity_id=db_finding.id
        )
    
    db.commit()
    
    # Refresh with relationships
    finding_id = db_finding.id
    
    # Reload with relationships
    db_finding = db.query(Finding).options(
        joinedload(Finding.assigned_to),
        joinedload(Finding.comments).joinedload(FindingComment.user)
    ).filter(Finding.id == finding_id).first()
    
    if not db_finding:
        raise HTTPException(status_code=404, detail="Finding not found after create")
    
    # Format response
    finding_dict = {
        **{k: v for k, v in db_finding.__dict__.items() if not k.startswith('_')},
        "assigned_to": {
            "id": db_finding.assigned_to.id,
            "full_name": db_finding.assigned_to.full_name,
            "email": db_finding.assigned_to.email
        } if db_finding.assigned_to else None,
        "comments": [
            {
                **{k: v for k, v in comment.__dict__.items() if not k.startswith('_')},
                "user": {
                    "id": comment.user.id,
                    "full_name": comment.user.full_name,
                    "email": comment.user.email
                } if comment.user else None
            }
            for comment in (db_finding.comments or [])
        ] if db_finding.comments else []
    }
    return FindingSchema(**finding_dict)

@router.get("/", response_model=List[FindingSchema])
def read_findings(
    skip: int = 0,
    limit: int = 100,
    audit_id: int = None,
    assigned_to_user_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Finding).options(
        joinedload(Finding.assigned_to),
        joinedload(Finding.comments).joinedload(FindingComment.user)
    )
    
    if audit_id:
        check_audit_access(current_user, audit_id, db)
        query = query.filter(Finding.audit_id == audit_id)
    else:
        # Filter by accessible audits
        from app.models.project import Project
        if current_user.role == UserRole.PLATFORM_ADMIN:
            pass  # See all
        elif current_user.role == UserRole.ORG_ADMIN:
            project_ids = [p.id for p in db.query(Project).filter(Project.organization_id == current_user.organization_id).all()]
            audit_ids = [a.id for a in db.query(Audit).filter(Audit.project_id.in_(project_ids)).all()]
            query = query.filter(Finding.audit_id.in_(audit_ids))
        else:
            project_ids = [pu.project_id for pu in current_user.project_assignments]
            audit_ids = [a.id for a in db.query(Audit).filter(Audit.project_id.in_(project_ids)).all()]
            query = query.filter(Finding.audit_id.in_(audit_ids))
    
    # Filter by assigned user if provided
    if assigned_to_user_id:
        query = query.filter(Finding.assigned_to_user_id == assigned_to_user_id)
    
    findings = query.offset(skip).limit(limit).all()
    
    # Format response with user info
    result = []
    for finding in findings:
        finding_dict = {
            **{k: v for k, v in finding.__dict__.items() if not k.startswith('_')},
            "assigned_to": {
                "id": finding.assigned_to.id,
                "full_name": finding.assigned_to.full_name,
                "email": finding.assigned_to.email
            } if finding.assigned_to else None,
            "comments": [
                {
                    **{k: v for k, v in comment.__dict__.items() if not k.startswith('_')},
                    "user": {
                        "id": comment.user.id,
                        "full_name": comment.user.full_name,
                        "email": comment.user.email
                    } if comment.user else None
                }
                for comment in (finding.comments or [])
            ] if finding.comments else []
        }
        result.append(FindingSchema(**finding_dict))
    
    return result

@router.get("/{finding_id}", response_model=FindingSchema)
def read_finding(
    finding_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    finding = db.query(Finding).options(
        joinedload(Finding.assigned_to),
        joinedload(Finding.comments).joinedload(FindingComment.user)
    ).filter(Finding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")
    
    check_audit_access(current_user, finding.audit_id, db)
    
    # Format response with user info
    finding_dict = {
        **{k: v for k, v in finding.__dict__.items() if not k.startswith('_')},
        "assigned_to": {
            "id": finding.assigned_to.id,
            "full_name": finding.assigned_to.full_name,
            "email": finding.assigned_to.email
        } if finding.assigned_to else None,
        "comments": [
            {
                **{k: v for k, v in comment.__dict__.items() if not k.startswith('_')},
                "user": {
                    "id": comment.user.id,
                    "full_name": comment.user.full_name,
                    "email": comment.user.email
                } if comment.user else None
            }
            for comment in (finding.comments or [])
        ] if finding.comments else []
    }
    return FindingSchema(**finding_dict)

@router.put("/{finding_id}", response_model=FindingSchema)
def update_finding(
    finding_id: int,
    finding: FindingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_finding = db.query(Finding).filter(Finding.id == finding_id).first()
    if not db_finding:
        raise HTTPException(status_code=404, detail="Finding not found")
    
    check_audit_access(current_user, db_finding.audit_id, db)
    
    update_data = finding.dict(exclude_unset=True)
    old_assigned_to = db_finding.assigned_to_user_id
    old_status = db_finding.status
    
    changes = {}
    for field, value in update_data.items():
        old_value = getattr(db_finding, field, None)
        if old_value != value:
            changes[field] = {"old": str(old_value), "new": str(value)}
            setattr(db_finding, field, value)
    
    # Log activity
    if changes:
        log_activity(
            db=db,
            entity_type="finding",
            entity_id=db_finding.id,
            action="updated",
            user_id=current_user.id,
            details={"changes": changes}
        )
        
        # Create notification if assigned to someone new
        if "assigned_to_user_id" in changes:
            new_assigned_to = update_data.get("assigned_to_user_id")
            if new_assigned_to and new_assigned_to != current_user.id:
                create_notification(
                    db=db,
                    user_id=new_assigned_to,
                    notification_type=NotificationType.FINDING_ASSIGNED,
                    title="Bulgu Atandı",
                    message=f'"{db_finding.title}" bulgusu size atandı',
                    related_entity_type="finding",
                    related_entity_id=db_finding.id
                )
        
        # Create notification if status changed
        if "status" in changes:
            new_status = update_data.get("status")
            if db_finding.assigned_to_user_id and db_finding.assigned_to_user_id != current_user.id:
                create_notification(
                    db=db,
                    user_id=db_finding.assigned_to_user_id,
                    notification_type=NotificationType.FINDING_STATUS_CHANGED,
                    title="Bulgu Durumu Değişti",
                    message=f'"{db_finding.title}" bulgusunun durumu "{new_status.value}" olarak güncellendi',
                    related_entity_type="finding",
                    related_entity_id=db_finding.id
                )
    
    db.commit()
    
    # Refresh with relationships
    finding_id = db_finding.id
    
    # Reload with relationships
    db_finding = db.query(Finding).options(
        joinedload(Finding.assigned_to),
        joinedload(Finding.comments).joinedload(FindingComment.user)
    ).filter(Finding.id == finding_id).first()
    
    if not db_finding:
        raise HTTPException(status_code=404, detail="Finding not found after update")
    
    # Format response
    finding_dict = {
        **{k: v for k, v in db_finding.__dict__.items() if not k.startswith('_')},
        "assigned_to": {
            "id": db_finding.assigned_to.id,
            "full_name": db_finding.assigned_to.full_name,
            "email": db_finding.assigned_to.email
        } if db_finding.assigned_to else None,
        "comments": [
            {
                **{k: v for k, v in comment.__dict__.items() if not k.startswith('_')},
                "user": {
                    "id": comment.user.id,
                    "full_name": comment.user.full_name,
                    "email": comment.user.email
                } if comment.user else None
            }
            for comment in (db_finding.comments or [])
        ] if db_finding.comments else []
    }
    return FindingSchema(**finding_dict)

@router.delete("/{finding_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_finding(
    finding_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_finding = db.query(Finding).filter(Finding.id == finding_id).first()
    if not db_finding:
        raise HTTPException(status_code=404, detail="Finding not found")
    
    check_audit_access(current_user, db_finding.audit_id, db)
    
    finding_title = db_finding.title
    finding_id_val = db_finding.id
    
    # Delete associated evidence files
    for evidence in db_finding.evidences:
        file_path = os.path.join(settings.UPLOAD_DIR, evidence.file_path)
        if os.path.exists(file_path):
            os.remove(file_path)
    
    # Log activity before deletion
    log_activity(
        db=db,
        entity_type="finding",
        entity_id=finding_id_val,
        action="deleted",
        user_id=current_user.id,
        details={"title": finding_title}
    )
    
    db.delete(db_finding)
    db.commit()
    return None

@router.post("/{finding_id}/evidences", response_model=EvidenceSchema, status_code=status.HTTP_201_CREATED)
def upload_evidence(
    finding_id: int,
    file: UploadFile = File(...),
    description: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    finding = db.query(Finding).filter(Finding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")
    
    check_audit_access(current_user, finding.audit_id, db)
    
    # Validate file size
    if file.size and file.size > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=400, detail=f"File too large. Maximum size: {settings.MAX_UPLOAD_SIZE / 1024 / 1024}MB")
    
    # Validate file extension
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required")
    
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    # Check blocked extensions
    if file_ext in settings.BLOCKED_FILE_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"File type '{file_ext}' is not allowed for security reasons"
        )
    
    # Check allowed extensions (if not blocked)
    if file_ext not in settings.ALLOWED_FILE_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"File type '{file_ext}' is not allowed. Allowed types: {', '.join(settings.ALLOWED_FILE_EXTENSIONS)}"
        )
    
    # Validate MIME type (basic check)
    content_type = file.content_type or ""
    # Only allow certain MIME types
    allowed_mime_types = [
        # Images
        "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
        # Documents
        "application/pdf",
        "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        # Text
        "text/plain", "text/csv", "text/markdown",
        # Archives
        "application/zip", "application/x-rar-compressed", "application/x-7z-compressed",
        # Generic fallback
        "application/octet-stream"  # Some files may not have specific MIME type
    ]
    
    # Generate unique filename
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
    
    # Ensure upload directory exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    # Save file
    with open(file_path, "wb") as buffer:
        content = file.file.read()
        buffer.write(content)
    
    # Create evidence record
    evidence = Evidence(
        finding_id=finding_id,
        file_path=unique_filename,
        file_name=file.filename,
        file_size=len(content),
        description=description
    )
    db.add(evidence)
    db.commit()
    db.refresh(evidence)
    return evidence

@router.get("/evidences/{evidence_id}/download")
def download_evidence(
    evidence_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    evidence = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    
    finding = db.query(Finding).filter(Finding.id == evidence.finding_id).first()
    check_audit_access(current_user, finding.audit_id, db)
    
    # Get file path
    file_path = os.path.join(settings.UPLOAD_DIR, evidence.file_path)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(
        file_path,
        media_type="application/octet-stream",
        filename=evidence.file_name
    )

@router.delete("/evidences/{evidence_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_evidence(
    evidence_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    evidence = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    
    finding = db.query(Finding).filter(Finding.id == evidence.finding_id).first()
    check_audit_access(current_user, finding.audit_id, db)
    
    # Delete file
    file_path = os.path.join(settings.UPLOAD_DIR, evidence.file_path)
    if os.path.exists(file_path):
        os.remove(file_path)
    
    # Log activity
    log_activity(
        db=db,
        entity_type="evidence",
        entity_id=evidence_id,
        action="deleted",
        user_id=current_user.id,
        details={"finding_id": finding.id, "file_name": evidence.file_name}
    )
    
    db.delete(evidence)
    db.commit()
    return None

# Comments endpoints
@router.post("/{finding_id}/comments", response_model=FindingCommentSchema, status_code=status.HTTP_201_CREATED)
def create_comment(
    finding_id: int,
    comment: FindingCommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    finding = db.query(Finding).filter(Finding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")
    
    check_audit_access(current_user, finding.audit_id, db)
    
    db_comment = FindingComment(
        finding_id=finding_id,
        user_id=current_user.id,
        comment=comment.comment
    )
    db.add(db_comment)
    db.flush()
    
    # Log activity
    log_activity(
        db=db,
        entity_type="finding",
        entity_id=finding_id,
        action="comment_added",
        user_id=current_user.id,
        details={"comment_id": db_comment.id}
    )
    
    # Create notification for assigned user if not the commenter
    if finding.assigned_to_user_id and finding.assigned_to_user_id != current_user.id:
        create_notification(
            db=db,
            user_id=finding.assigned_to_user_id,
            notification_type=NotificationType.COMMENT_ADDED,
            title="Bulguya Yorum Eklendi",
            message=f'"{finding.title}" bulgusuna yorum eklendi',
            related_entity_type="finding",
            related_entity_id=finding_id
        )
    
    db.commit()
    db.refresh(db_comment)
    if db_comment.user:
        db.refresh(db_comment.user)
    
    # Format response
    comment_dict = {
        **{k: v for k, v in db_comment.__dict__.items() if not k.startswith('_')},
        "user": {
            "id": db_comment.user.id,
            "full_name": db_comment.user.full_name,
            "email": db_comment.user.email
        } if db_comment.user else None
    }
    return FindingCommentSchema(**comment_dict)

@router.get("/{finding_id}/comments", response_model=List[FindingCommentSchema])
def get_comments(
    finding_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    finding = db.query(Finding).filter(Finding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")
    
    check_audit_access(current_user, finding.audit_id, db)
    
    comments = db.query(FindingComment).options(
        joinedload(FindingComment.user)
    ).filter(FindingComment.finding_id == finding_id).order_by(FindingComment.created_at).all()
    
    # Format response
    result = []
    for comment in comments:
        comment_dict = {
            **{k: v for k, v in comment.__dict__.items() if not k.startswith('_')},
            "user": {
                "id": comment.user.id,
                "full_name": comment.user.full_name,
                "email": comment.user.email
            } if comment.user else None
        }
        result.append(FindingCommentSchema(**comment_dict))
    
    return result

@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    comment = db.query(FindingComment).filter(FindingComment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # Only allow deletion by comment owner or admin
    if comment.user_id != current_user.id and current_user.role not in [UserRole.PLATFORM_ADMIN, UserRole.ORG_ADMIN]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    finding = db.query(Finding).filter(Finding.id == comment.finding_id).first()
    check_audit_access(current_user, finding.audit_id, db)
    
    # Log activity
    log_activity(
        db=db,
        entity_type="finding",
        entity_id=comment.finding_id,
        action="comment_deleted",
        user_id=current_user.id,
        details={"comment_id": comment_id}
    )
    
    db.delete(comment)
    db.commit()
    return None

