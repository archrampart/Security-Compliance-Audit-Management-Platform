from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from app.models.activity import ActivityLog
from app.models.user import User

def log_activity(
    db: Session,
    entity_type: str,
    entity_id: int,
    action: str,
    user_id: Optional[int] = None,
    details: Optional[Dict[str, Any]] = None
):
    """Log an activity to the activity log table"""
    activity_log = ActivityLog(
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        user_id=user_id,
        details=details or {}
    )
    db.add(activity_log)
    db.flush()  # Don't commit, let the caller commit
    return activity_log





