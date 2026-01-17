from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.user import User, UserRole
from app.schemas.user import User as UserSchema, UserCreate, UserUpdate, UserPasswordUpdate
from app.core.dependencies import get_current_user, require_org_admin_or_platform_admin
from app.core.security import get_password_hash, verify_password

router = APIRouter()

@router.post("/", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
def create_user(
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_org_admin_or_platform_admin)
):
    # Check if email already exists
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check permissions
    if current_user.role == UserRole.ORG_ADMIN:
        # Org admin can only create users in their organization
        if user.organization_id != current_user.organization_id:
            raise HTTPException(status_code=403, detail="Cannot create user in different organization")
        # Org admin cannot create platform admins
        if user.role == UserRole.PLATFORM_ADMIN:
            raise HTTPException(status_code=403, detail="Cannot create platform admin")
    
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        organization_id=user.organization_id,
        hashed_password=hashed_password,
        is_active=user.is_active
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.get("/", response_model=List[UserSchema])
def read_users(
    skip: int = 0,
    limit: int = 100,
    organization_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(User)
    
    if current_user.role == UserRole.PLATFORM_ADMIN:
        if organization_id:
            query = query.filter(User.organization_id == organization_id)
    elif current_user.role == UserRole.ORG_ADMIN:
        query = query.filter(User.organization_id == current_user.organization_id)
    else:
        # Auditor can only see themselves
        query = query.filter(User.id == current_user.id)
    
    users = query.offset(skip).limit(limit).all()
    return users

@router.get("/{user_id}", response_model=UserSchema)
def read_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check access
    if current_user.role == UserRole.PLATFORM_ADMIN:
        pass
    elif current_user.role == UserRole.ORG_ADMIN:
        if db_user.organization_id != current_user.organization_id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
    else:
        if db_user.id != current_user.id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
    
    return db_user

@router.put("/{user_id}", response_model=UserSchema)
def update_user(
    user_id: int,
    user: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_org_admin_or_platform_admin)
):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check permissions
    if current_user.role == UserRole.ORG_ADMIN:
        if db_user.organization_id != current_user.organization_id:
            raise HTTPException(status_code=403, detail="Cannot update user in different organization")
        if user.role and user.role == UserRole.PLATFORM_ADMIN:
            raise HTTPException(status_code=403, detail="Cannot assign platform admin role")
    
    update_data = user.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_user, field, value)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_org_admin_or_platform_admin)
):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent users from deleting their own account
    if db_user.id == current_user.id:
        raise HTTPException(
            status_code=403, 
            detail="You cannot delete your own account. Please contact an administrator."
        )
    
    # Check permissions
    if current_user.role == UserRole.ORG_ADMIN:
        if db_user.organization_id != current_user.organization_id:
            raise HTTPException(status_code=403, detail="Cannot delete user in different organization")
    
    db.delete(db_user)
    db.commit()
    return None

@router.post("/me/change-password", status_code=status.HTTP_200_OK)
def change_password(
    password_data: UserPasswordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Allow users to change their own password"""
    # Verify current password
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect"
        )
    
    # Validate new password (minimum 6 characters)
    if len(password_data.new_password) < 6:
        raise HTTPException(
            status_code=400,
            detail="New password must be at least 6 characters long"
        )
    
    # Check if new password is different from current password
    if verify_password(password_data.new_password, current_user.hashed_password):
        raise HTTPException(
            status_code=400,
            detail="New password must be different from current password"
        )
    
    # Update password
    current_user.hashed_password = get_password_hash(password_data.new_password)
    db.commit()
    
    return {"message": "Password changed successfully"}

