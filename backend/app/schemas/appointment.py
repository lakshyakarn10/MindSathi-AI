from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

class AppointmentCreate(BaseModel):
    counselor_id: Optional[str] = None
    session_type: str = "counseling"
    mode: str = "video" # video, phone, in_person
    reason: str = "academic_stress"
    scheduled_start: datetime
    duration_minutes: int = 45
    student_notes: Optional[str] = None

class AppointmentRead(BaseModel):
    id: str
    student_id: str
    anonymous_id: Optional[str] = None
    counselor_id: str
    counselor_name: Optional[str] = None
    session_type: str
    mode: str
    reason: str
    scheduled_start: datetime
    scheduled_end: datetime
    duration_minutes: int
    status: str
    student_notes: Optional[str] = None
    counselor_notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class RescheduleRequest(BaseModel):
    new_start: datetime
    message: Optional[str] = None

class CancelRequest(BaseModel):
    reason: Optional[str] = "Student requested cancellation"

class SessionNotesCreate(BaseModel):
    discussion_topics: str
    summary: str
    recommendations: str
    follow_up_required: bool = False
    next_follow_up_date: Optional[datetime] = None

class SessionRecordRead(BaseModel):
    id: str
    appointment_id: str
    discussion_topics: str
    summary: str
    recommendations: str
    follow_up_required: bool
    next_follow_up_date: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True
