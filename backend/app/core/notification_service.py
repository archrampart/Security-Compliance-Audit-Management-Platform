from sqlalchemy.orm import Session
from typing import Optional
from app.models.notification import Notification, NotificationType
from app.models.user import User

def create_notification(
    db: Session,
    user_id: int,
    notification_type: NotificationType,
    title: str,
    message: str,
    related_entity_type: Optional[str] = None,
    related_entity_id: Optional[int] = None
):
    """Create a notification for a user"""
    notification = Notification(
        user_id=user_id,
        type=notification_type,
        title=title,
        message=message,
        related_entity_type=related_entity_type,
        related_entity_id=related_entity_id
    )
    db.add(notification)
    db.flush()  # Don't commit, let the caller commit
    return notification

def check_due_dates(db: Session):
    """Check for findings that are due soon or overdue and create notifications"""
    from datetime import datetime, timedelta
    from app.models.finding import Finding
    from app.models.template import Status
    
    now = datetime.now()
    three_days_later = now + timedelta(days=3)
    
    # Find findings due in next 3 days (not yet notified)
    findings_due_soon = db.query(Finding).filter(
        Finding.due_date.isnot(None),
        Finding.due_date <= three_days_later,
        Finding.due_date > now,
        Finding.status.in_([Status.OPEN, Status.IN_PROGRESS]),
        Finding.assigned_to_user_id.isnot(None)
    ).all()
    
    # Find overdue findings
    overdue_findings = db.query(Finding).filter(
        Finding.due_date.isnot(None),
        Finding.due_date < now,
        Finding.status.in_([Status.OPEN, Status.IN_PROGRESS]),
        Finding.assigned_to_user_id.isnot(None)
    ).all()
    
    for finding in findings_due_soon:
        # Check if notification already exists (simplified - in production, track this better)
        existing = db.query(Notification).filter(
            Notification.user_id == finding.assigned_to_user_id,
            Notification.type == NotificationType.FINDING_DUE_SOON,
            Notification.related_entity_type == "finding",
            Notification.related_entity_id == finding.id
        ).first()
        
        if not existing:
            create_notification(
                db=db,
                user_id=finding.assigned_to_user_id,
                notification_type=NotificationType.FINDING_DUE_SOON,
                title="Bulgu Yakında Son Tarih",
                message=f'"{finding.title}" bulgusu yakında son tarih ({(finding.due_date - now).days} gün kaldı)',
                related_entity_type="finding",
                related_entity_id=finding.id
            )
    
    for finding in overdue_findings:
        # Check if notification already exists
        existing = db.query(Notification).filter(
            Notification.user_id == finding.assigned_to_user_id,
            Notification.type == NotificationType.FINDING_OVERDUE,
            Notification.related_entity_type == "finding",
            Notification.related_entity_id == finding.id
        ).first()
        
        if not existing:
            days_overdue = (now - finding.due_date).days
            create_notification(
                db=db,
                user_id=finding.assigned_to_user_id,
                notification_type=NotificationType.FINDING_OVERDUE,
                title="Bulgu Son Tarih Geçti",
                message=f'"{finding.title}" bulgusu son tarih geçti ({days_overdue} gün)',
                related_entity_type="finding",
                related_entity_id=finding.id
            )
    
    db.commit()





