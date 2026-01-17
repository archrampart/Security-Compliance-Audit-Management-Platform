from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Enum, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.database import Base
from app.models.audit import AuditStandard

class Severity(str, enum.Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"

class Status(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"

class Template(Base):
    __tablename__ = "templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)  # Turkish name
    name_en = Column(String, nullable=True)  # English name
    description = Column(Text, nullable=True)  # Turkish description
    description_en = Column(Text, nullable=True)  # English description
    standard = Column(Enum(AuditStandard), nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)  # None for system templates
    is_system = Column(Boolean, default=False, nullable=False)  # Sistem şablonu (silinemez)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    organization = relationship("Organization", back_populates="templates")
    items = relationship("TemplateItem", back_populates="template", cascade="all, delete-orphan", order_by="TemplateItem.order_number")

class TemplateItem(Base):
    __tablename__ = "template_items"

    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("templates.id"), nullable=False)
    order_number = Column(Integer, nullable=False)
    control_reference = Column(String, nullable=True)  # e.g., "A.5.1.1"
    default_title = Column(String, nullable=False)  # Turkish title
    default_title_en = Column(String, nullable=True)  # English title
    default_description = Column(Text, nullable=True)  # Turkish description
    default_description_en = Column(Text, nullable=True)  # English description
    default_severity = Column(Enum(Severity), nullable=False, default=Severity.MEDIUM)
    default_status = Column(Enum(Status), nullable=False, default=Status.OPEN)
    default_recommendation = Column(Text, nullable=True)  # Turkish recommendation
    default_recommendation_en = Column(Text, nullable=True)  # English recommendation
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    template = relationship("Template", back_populates="items")

