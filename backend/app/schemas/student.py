from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

class StudentRead(BaseModel):
    id: str
    anonymous_id: str
    department: str
    year_of_study: int
    preferred_language: str
    timezone: str
    onboarding_completed: bool
    created_at: datetime

    class Config:
        from_attributes = True

class StudentUpdate(BaseModel):
    department: Optional[str] = None
    year_of_study: Optional[int] = None
    preferred_language: Optional[str] = None
    timezone: Optional[str] = None

class OnboardingRequest(BaseModel):
    preferred_language: str = "en"
    wellness_goals: List[str] = ["Manage exam stress", "Improve sleep routine"]
    support_preferences: List[str] = ["Self-guided exercises", "AI companion"]
    consent_settings: dict = {"wellness_data": True, "ai_analysis": True}
