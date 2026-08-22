from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class AdminRead(BaseModel):
    id: str
    user_id: str
    name: Optional[str] = None
    email: Optional[str] = None
    designation: str
    authorization_status: str
    created_at: datetime

    class Config:
        from_attributes = True

class AdminUpdate(BaseModel):
    designation: Optional[str] = None
