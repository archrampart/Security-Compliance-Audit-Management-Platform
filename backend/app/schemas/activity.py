from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class ActivityLogBase(BaseModel):
    entity_type: str
    entity_id: int
    action: str
    details: Optional[Dict[str, Any]] = None

class ActivityLogCreate(ActivityLogBase):
    pass

class ActivityLog(ActivityLogBase):
    id: int
    user_id: Optional[int] = None
    created_at: datetime
    user: Optional[dict] = None  # Will be populated with user info

    class Config:
        from_attributes = True





