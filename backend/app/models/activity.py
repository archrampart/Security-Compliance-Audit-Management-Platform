from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    entity_type = Column(String, nullable=False)  # e.g., "project", "audit", "finding"
    entity_id = Column(Integer, nullable=False)
    action = Column(String, nullable=False)  # e.g., "created", "updated", "deleted", "comment_added"
    details = Column(JSON, nullable=True)  # JSON field for additional details
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User")





