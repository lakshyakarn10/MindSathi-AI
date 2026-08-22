from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class CounselorRead(BaseModel):
    id: str
    user_id: str
    name: Optional[str] = None
    email: Optional[str] = None
    professional_role: str
    employee_id: str
    department: str
    verification_status: str
    availability_status: str
    cases_count: Optional[int] = 0
    sessions_count: Optional[int] = 0
    response_time: Optional[str] = "18 min"
    created_at: datetime

    class Config:
        from_attributes = True

class CounselorUpdate(BaseModel):
    professional_role: Optional[str] = None
    department: Optional[str] = None
    availability_status: Optional[str] = None

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
