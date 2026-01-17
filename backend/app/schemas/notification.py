from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.notification import NotificationType

class NotificationBase(BaseModel):
    type: NotificationType
    title: str
    message: str
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[int] = None

class NotificationCreate(NotificationBase):
    user_id: int

class NotificationUpdate(BaseModel):
    read: Optional[bool] = None

class Notification(NotificationBase):
    id: int
    user_id: int
    read: bool
    created_at: datetime

    class Config:
        from_attributes = True





