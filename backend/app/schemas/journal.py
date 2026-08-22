from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class JournalCreate(BaseModel):
    content: str
    mood: Optional[str] = "Neutral"

class JournalRead(BaseModel):
    id: str
    student_id: str
    content: str # Decrypted for the owner student
    mood: Optional[str] = "Neutral"
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class JournalUpdate(BaseModel):
    content: Optional[str] = None
    mood: Optional[str] = None
