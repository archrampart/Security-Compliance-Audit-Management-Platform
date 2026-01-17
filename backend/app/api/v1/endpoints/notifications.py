from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.models.notification import Notification, NotificationType
from app.schemas.notification import Notification as NotificationSchema, NotificationUpdate
from app.core.dependencies import get_current_user
from app.core.notification_service import check_due_dates
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=List[NotificationSchema])
def get_notifications(
    read: Optional[bool] = Query(None, description="Filter by read status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get notifications for current user"""
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    
    if read is not None:
        query = query.filter(Notification.read == read)
    
    notifications = query.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()
    return notifications

@router.get("/unread/count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get count of unread notifications"""
    count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.read == False
    ).count()
    return {"count": count}

@router.put("/{notification_id}/read", response_model=NotificationSchema)
def mark_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark a notification as read"""
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    if notification.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    notification.read = True
    db.commit()
    db.refresh(notification)
    return notification

@router.put("/read-all", response_model=dict)
def mark_all_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark all notifications as read for current user"""
    updated = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.read == False
    ).update({"read": True})
    db.commit()
    return {"updated": updated}

@router.delete("/{notification_id}", status_code=204)
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a notification"""
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    if notification.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    db.delete(notification)
    db.commit()
    return None

@router.post("/check-due-dates")
def trigger_due_date_check(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Manually trigger due date check (admin only)"""
    from app.models.user import UserRole
    if current_user.role != UserRole.PLATFORM_ADMIN:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    check_due_dates(db)
    return {"message": "Due date check completed"}

