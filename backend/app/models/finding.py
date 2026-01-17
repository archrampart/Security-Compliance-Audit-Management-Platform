from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base
from app.models.template import Severity, Status

class Finding(Base):
    __tablename__ = "findings"

    id = Column(Integer, primary_key=True, index=True)
    audit_id = Column(Integer, ForeignKey("audits.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    control_reference = Column(String, nullable=True)  # e.g., "A.5.1.1"
    severity = Column(Enum(Severity), nullable=False, default=Severity.MEDIUM)
    status = Column(Enum(Status), nullable=False, default=Status.OPEN)
    recommendation = Column(Text, nullable=True)
    assigned_to_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    due_date = Column(DateTime(timezone=True), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    audit = relationship("Audit", back_populates="findings")
    evidences = relationship("Evidence", back_populates="finding", cascade="all, delete-orphan")
    assigned_to = relationship("User", foreign_keys=[assigned_to_user_id])
    comments = relationship("FindingComment", back_populates="finding", cascade="all, delete-orphan", order_by="FindingComment.created_at")

class Evidence(Base):
    __tablename__ = "evidences"

    id = Column(Integer, primary_key=True, index=True)
    finding_id = Column(Integer, ForeignKey("findings.id", ondelete="CASCADE"), nullable=False)
    file_path = Column(String, nullable=False)
    file_name = Column(String, nullable=False)
    file_size = Column(Integer, nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    finding = relationship("Finding", back_populates="evidences")

class FindingComment(Base):
    __tablename__ = "finding_comments"

    id = Column(Integer, primary_key=True, index=True)
    finding_id = Column(Integer, ForeignKey("findings.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=False)
    comment = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    finding = relationship("Finding", back_populates="comments")
    user = relationship("User")

