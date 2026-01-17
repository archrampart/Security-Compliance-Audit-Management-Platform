from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.project import Project, ProjectUser
from app.models.user import User, UserRole
from app.schemas.project import Project as ProjectSchema, ProjectCreate, ProjectUpdate
from app.core.dependencies import get_current_user, get_user_projects

router = APIRouter()

@router.post("/", response_model=ProjectSchema, status_code=status.HTTP_201_CREATED)
def create_project(
    project: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check permissions
    if current_user.role == UserRole.PLATFORM_ADMIN:
        pass
    elif current_user.role == UserRole.ORG_ADMIN:
        if project.organization_id != current_user.organization_id:
            raise HTTPException(status_code=403, detail="Cannot create project in different organization")
    else:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    db_project = Project(
        name=project.name,
        description=project.description,
        organization_id=project.organization_id
    )
    db.add(db_project)
    db.flush()
    
    # Assign users
    if project.user_ids:
        for user_id in project.user_ids:
            # Verify user belongs to same organization
            user = db.query(User).filter(User.id == user_id).first()
            if user and user.organization_id == project.organization_id:
                project_user = ProjectUser(project_id=db_project.id, user_id=user_id)
                db.add(project_user)
    
    db.commit()
    db.refresh(db_project)
    return db_project

@router.get("/", response_model=List[ProjectSchema])
def read_projects(
    skip: int = 0,
    limit: int = 100,
    organization_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == UserRole.PLATFORM_ADMIN:
        query = db.query(Project)
        if organization_id:
            query = query.filter(Project.organization_id == organization_id)
        projects = query.offset(skip).limit(limit).all()
    elif current_user.role == UserRole.ORG_ADMIN:
        query = db.query(Project).filter(Project.organization_id == current_user.organization_id)
        projects = query.offset(skip).limit(limit).all()
    else:
        # Auditor sees only assigned projects
        project_ids = [pu.project_id for pu in current_user.project_assignments]
        projects = db.query(Project).filter(Project.id.in_(project_ids)).offset(skip).limit(limit).all()
    
    return projects

@router.get("/{project_id}", response_model=ProjectSchema)
def read_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check access
    if current_user.role == UserRole.PLATFORM_ADMIN:
        pass
    elif current_user.role == UserRole.ORG_ADMIN:
        if project.organization_id != current_user.organization_id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
    else:
        # Auditor can only see assigned projects
        project_ids = [pu.project_id for pu in current_user.project_assignments]
        if project_id not in project_ids:
            raise HTTPException(status_code=403, detail="Not enough permissions")
    
    return project

@router.put("/{project_id}", response_model=ProjectSchema)
def update_project(
    project_id: int,
    project: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_project = db.query(Project).filter(Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check permissions
    if current_user.role == UserRole.PLATFORM_ADMIN:
        pass
    elif current_user.role == UserRole.ORG_ADMIN:
        if db_project.organization_id != current_user.organization_id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
    else:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    update_data = project.dict(exclude_unset=True)
    user_ids = update_data.pop("user_ids", None)
    
    for field, value in update_data.items():
        setattr(db_project, field, value)
    
    # Update user assignments
    if user_ids is not None:
        # Remove existing assignments
        db.query(ProjectUser).filter(ProjectUser.project_id == project_id).delete()
        # Add new assignments
        for user_id in user_ids:
            user = db.query(User).filter(User.id == user_id).first()
            if user and user.organization_id == db_project.organization_id:
                project_user = ProjectUser(project_id=project_id, user_id=user_id)
                db.add(project_user)
    
    db.commit()
    db.refresh(db_project)
    return db_project

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.models.audit import Audit
    from app.models.finding import Finding, Evidence
    from sqlalchemy.orm import joinedload
    
    db_project = db.query(Project).options(
        joinedload(Project.audits).joinedload(Audit.findings).joinedload(Finding.evidences)
    ).filter(Project.id == project_id).first()
    
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check permissions
    if current_user.role == UserRole.PLATFORM_ADMIN:
        pass
    elif current_user.role == UserRole.ORG_ADMIN:
        if db_project.organization_id != current_user.organization_id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
    else:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Delete all related data manually to avoid foreign key constraint issues
    # Delete evidences first (child of findings)
    for audit in db_project.audits:
        for finding in audit.findings:
            # Delete evidence files from filesystem
            import os
            from app.core.config import settings
            for evidence in finding.evidences:
                file_path = os.path.join(settings.UPLOAD_DIR, evidence.file_path)
                if os.path.exists(file_path):
                    try:
                        os.remove(file_path)
                    except Exception as e:
                        print(f"Warning: Could not delete evidence file {file_path}: {e}")
                db.delete(evidence)
    
    # Delete findings (child of audits)
    for audit in db_project.audits:
        for finding in audit.findings:
            db.delete(finding)
    
    # Delete audits (child of projects)
    for audit in db_project.audits:
        db.delete(audit)
    
    # Delete project user assignments
    db.query(ProjectUser).filter(ProjectUser.project_id == project_id).delete()
    
    # Delete project_users association table entries
    from sqlalchemy import delete
    from app.models.project import project_user_association
    stmt = delete(project_user_association).where(project_user_association.c.project_id == project_id)
    db.execute(stmt)
    
    # Finally delete the project
    db.delete(db_project)
    db.commit()
    return None

@router.post("/{project_id}/copy", response_model=ProjectSchema, status_code=status.HTTP_201_CREATED)
def copy_project(
    project_id: int,
    new_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    source_project = db.query(Project).filter(Project.id == project_id).first()
    if not source_project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check permissions
    if current_user.role == UserRole.PLATFORM_ADMIN:
        pass
    elif current_user.role == UserRole.ORG_ADMIN:
        if source_project.organization_id != current_user.organization_id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
    else:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Create new project
    new_project = Project(
        name=new_name,
        description=source_project.description,
        organization_id=source_project.organization_id
    )
    db.add(new_project)
    db.flush()
    
    # Copy audits (without findings for now, can be extended)
    # This is a simplified copy - you might want to copy audits and findings too
    
    db.commit()
    db.refresh(new_project)
    return new_project

