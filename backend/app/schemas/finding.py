from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.template import Severity, Status

class EvidenceBase(BaseModel):
    description: Optional[str] = None

class EvidenceCreate(EvidenceBase):
    pass

class Evidence(EvidenceBase):
    id: int
    finding_id: int
    file_path: str
    file_name: str
    file_size: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

class FindingCommentBase(BaseModel):
    comment: str

class FindingCommentCreate(FindingCommentBase):
    pass

class FindingComment(FindingCommentBase):
    id: int
    finding_id: int
    user_id: int
    created_at: datetime
    user: Optional[dict] = None  # Will be populated with user info

    class Config:
        from_attributes = True

class FindingBase(BaseModel):
    title: str
    description: Optional[str] = None
    control_reference: Optional[str] = None
    severity: Severity = Severity.MEDIUM
    status: Status = Status.OPEN
    recommendation: Optional[str] = None
    assigned_to_user_id: Optional[int] = None
    due_date: Optional[datetime] = None

class FindingCreate(FindingBase):
    audit_id: int

class FindingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    control_reference: Optional[str] = None
    severity: Optional[Severity] = None
    status: Optional[Status] = None
    recommendation: Optional[str] = None
    assigned_to_user_id: Optional[int] = None
    due_date: Optional[datetime] = None

class Finding(FindingBase):
    id: int
    audit_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    evidences: List[Evidence] = []
    comments: List[FindingComment] = []
    assigned_to: Optional[dict] = None  # Will be populated with user info

    class Config:
        from_attributes = True

