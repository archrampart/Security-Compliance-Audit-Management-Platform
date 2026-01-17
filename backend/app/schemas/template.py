from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.audit import AuditStandard
from app.models.template import Severity, Status

class TemplateItemBase(BaseModel):
    order_number: int
    control_reference: Optional[str] = None
    default_title: str
    default_title_en: Optional[str] = None
    default_description: Optional[str] = None
    default_description_en: Optional[str] = None
    default_severity: Severity = Severity.MEDIUM
    default_status: Status = Status.OPEN
    default_recommendation: Optional[str] = None
    default_recommendation_en: Optional[str] = None

class TemplateItemCreate(TemplateItemBase):
    pass

class TemplateItem(TemplateItemBase):
    id: int
    template_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class TemplateBase(BaseModel):
    name: str
    name_en: Optional[str] = None
    description: Optional[str] = None
    description_en: Optional[str] = None
    standard: AuditStandard

class TemplateCreate(TemplateBase):
    organization_id: Optional[int] = None
    items: Optional[List[TemplateItemCreate]] = []

class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    name_en: Optional[str] = None
    description: Optional[str] = None
    description_en: Optional[str] = None
    standard: Optional[AuditStandard] = None

class TemplateCopy(BaseModel):
    new_name: Optional[str] = None
    organization_id: Optional[int] = None  # Required when copying system templates as platform admin

class Template(TemplateBase):
    id: int
    organization_id: Optional[int] = None  # None for system templates
    is_system: bool = False
    created_at: datetime
    updated_at: Optional[datetime] = None
    items: List[TemplateItem] = []

    class Config:
        from_attributes = True

