from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.database import Base

class NotificationType(str, enum.Enum):
    FINDING_ASSIGNED = "finding_assigned"
    FINDING_DUE_SOON = "finding_due_soon"
    FINDING_OVERDUE = "finding_overdue"
    FINDING_STATUS_CHANGED = "finding_status_changed"
    COMMENT_ADDED = "comment_added"
    AUDIT_STATUS_CHANGED = "audit_status_changed"

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(Enum(NotificationType), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    related_entity_type = Column(String, nullable=True)  # 'finding', 'audit', etc.
    related_entity_id = Column(Integer, nullable=True)
    read = Column(Boolean, default=False, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Relationships
    user = relationship("User")





