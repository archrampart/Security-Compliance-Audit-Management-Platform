from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.audit import AuditStandard, AuditStatus

class AuditBase(BaseModel):
    name: str
    description: Optional[str] = None
    standard: AuditStandard
    audit_date: Optional[datetime] = None
    status: AuditStatus = AuditStatus.PLANNING

class AuditCreate(AuditBase):
    project_id: int
    template_id: Optional[int] = None  # If provided, create findings from template
    language: Optional[str] = "tr"  # Language for template items (tr/en)

class AuditUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    standard: Optional[AuditStandard] = None
    audit_date: Optional[datetime] = None
    status: Optional[AuditStatus] = None

class Audit(AuditBase):
    id: int
    project_id: int
    language: str = "tr"
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

