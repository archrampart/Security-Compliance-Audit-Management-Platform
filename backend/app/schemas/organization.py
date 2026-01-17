from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class OrganizationBase(BaseModel):
    name: str
    description: Optional[str] = None
    logo_url: Optional[str] = None

class OrganizationCreate(OrganizationBase):
    pass

class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    is_active: Optional[bool] = None

class Organization(OrganizationBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

