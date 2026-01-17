from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User, UserRole
from app.core.security import decode_access_token
from app.schemas.auth import TokenData

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    email: str = payload.get("sub")
    if email is None:
        raise credentials_exception
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user

def require_role(allowed_roles: list[UserRole]):
    async def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        return current_user
    return role_checker

def require_platform_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.PLATFORM_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Platform admin access required"
        )
    return current_user

def require_org_admin_or_platform_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in [UserRole.ORG_ADMIN, UserRole.PLATFORM_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organization admin or platform admin access required"
        )
    return current_user

def get_user_projects(user: User, db: Session):
    """Get projects accessible by user based on role"""
    if user.role == UserRole.PLATFORM_ADMIN:
        # Platform admin sees all projects
        from app.models.project import Project
        return db.query(Project).all()
    elif user.role == UserRole.ORG_ADMIN:
        # Org admin sees all projects in their organization
        from app.models.project import Project
        return db.query(Project).filter(Project.organization_id == user.organization_id).all()
    else:
        # Auditor sees only assigned projects
        return user.project_assignments

