from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime
from app.db.database import get_db
from app.models.activity import ActivityLog
from app.models.user import User, UserRole
from app.schemas.activity import ActivityLog as ActivityLogSchema
from app.core.dependencies import get_current_user

router = APIRouter()

@router.get("/", response_model=List[ActivityLogSchema])
def get_activity_logs(
    entity_type: Optional[str] = Query(None, description="Filter by entity type (finding, audit, project, etc.)"),
    entity_id: Optional[int] = Query(None, description="Filter by entity ID"),
    action: Optional[str] = Query(None, description="Filter by action"),
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get activity logs with optional filters"""
    query = db.query(ActivityLog).options(joinedload(ActivityLog.user))
    
    # Apply filters
    if entity_type:
        query = query.filter(ActivityLog.entity_type == entity_type)
    if entity_id:
        query = query.filter(ActivityLog.entity_id == entity_id)
    if action:
        query = query.filter(ActivityLog.action == action)
    if user_id:
        # Only platform/admin can view other users' activity
        if current_user.role == UserRole.PLATFORM_ADMIN or current_user.id == user_id:
            query = query.filter(ActivityLog.user_id == user_id)
        else:
            raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Order by most recent first
    query = query.order_by(ActivityLog.created_at.desc())
    
    # Apply pagination
    logs = query.offset(skip).limit(limit).all()
    
    # Format response
    result = []
    for log in logs:
        log_dict = {
            **{k: v for k, v in log.__dict__.items() if not k.startswith('_')},
            "user": {
                "id": log.user.id,
                "full_name": log.user.full_name,
                "email": log.user.email
            } if log.user else None
        }
        result.append(ActivityLogSchema(**log_dict))
    
    return result

@router.get("/{entity_type}/{entity_id}", response_model=List[ActivityLogSchema])
def get_entity_activity_logs(
    entity_type: str,
    entity_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get activity logs for a specific entity"""
    query = db.query(ActivityLog).options(joinedload(ActivityLog.user)).filter(
        ActivityLog.entity_type == entity_type,
        ActivityLog.entity_id == entity_id
    ).order_by(ActivityLog.created_at.desc())
    
    logs = query.offset(skip).limit(limit).all()
    
    # Format response
    result = []
    for log in logs:
        log_dict = {
            **{k: v for k, v in log.__dict__.items() if not k.startswith('_')},
            "user": {
                "id": log.user.id,
                "full_name": log.user.full_name,
                "email": log.user.email
            } if log.user else None
        }
        result.append(ActivityLogSchema(**log_dict))
    
    return result

