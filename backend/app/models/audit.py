from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.database import Base

class AuditStandard(str, enum.Enum):
    ISO27001 = "ISO27001"
    PCI_DSS = "PCI_DSS"
    KVKK = "KVKK"
    GDPR = "GDPR"
    NIST = "NIST"
    CIS = "CIS"
    SOC2 = "SOC2"
    OWASP_TOP10 = "OWASP_TOP10"
    OWASP_ASVS = "OWASP_ASVS"
    OWASP_API = "OWASP_API"
    OWASP_MOBILE = "OWASP_MOBILE"
    ISO27017 = "ISO27017"
    ISO27018 = "ISO27018"
    HIPAA = "HIPAA"
    COBIT = "COBIT"
    ENISA = "ENISA"
    CMMC = "CMMC"
    FEDRAMP = "FEDRAMP"
    ITIL = "ITIL"
    ISO22301 = "ISO22301"
    OTHER = "OTHER"

class AuditStatus(str, enum.Enum):
    PLANNING = "planning"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class Audit(Base):
    __tablename__ = "audits"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    standard = Column(Enum(AuditStandard), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    audit_date = Column(DateTime(timezone=True), nullable=True)
    status = Column(Enum(AuditStatus, values_callable=lambda x: [e.value for e in x]), nullable=False, default=AuditStatus.PLANNING, index=True)
    language = Column(String(5), nullable=False, default="tr")  # Language for reports (tr/en)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    project = relationship("Project", back_populates="audits")
    findings = relationship("Finding", back_populates="audit", cascade="all, delete-orphan")

