from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.organization import Organization
from app.models.user import User, UserRole
from app.schemas.organization import Organization as OrganizationSchema, OrganizationCreate, OrganizationUpdate
from app.core.dependencies import get_current_user, require_platform_admin

router = APIRouter()

@router.post("/", response_model=OrganizationSchema, status_code=status.HTTP_201_CREATED)
def create_organization(
    organization: OrganizationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_platform_admin)
):
    db_org = Organization(**organization.dict())
    db.add(db_org)
    db.commit()
    db.refresh(db_org)
    return db_org

@router.get("/", response_model=List[OrganizationSchema])
def read_organizations(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == UserRole.PLATFORM_ADMIN:
        organizations = db.query(Organization).offset(skip).limit(limit).all()
    else:
        # Org admin and auditor see only their organization
        if not current_user.organization_id:
            return []
        organizations = db.query(Organization).filter(Organization.id == current_user.organization_id).all()
    return organizations

@router.get("/{organization_id}", response_model=OrganizationSchema)
def read_organization(
    organization_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    org = db.query(Organization).filter(Organization.id == organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    # Check access
    if current_user.role != UserRole.PLATFORM_ADMIN:
        if current_user.organization_id != organization_id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
    
    return org

@router.put("/{organization_id}", response_model=OrganizationSchema)
def update_organization(
    organization_id: int,
    organization: OrganizationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_org = db.query(Organization).filter(Organization.id == organization_id).first()
    if not db_org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    # Check access
    if current_user.role == UserRole.PLATFORM_ADMIN:
        pass  # Platform admin can update any org
    elif current_user.role == UserRole.ORG_ADMIN and current_user.organization_id == organization_id:
        pass  # Org admin can update their own org
    else:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    update_data = organization.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_org, field, value)
    db.commit()
    db.refresh(db_org)
    return db_org

@router.delete("/{organization_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_organization(
    organization_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_platform_admin)
):
    db_org = db.query(Organization).filter(Organization.id == organization_id).first()
    if not db_org:
        raise HTTPException(status_code=404, detail="Organization not found")
    db.delete(db_org)
    db.commit()
    return None

