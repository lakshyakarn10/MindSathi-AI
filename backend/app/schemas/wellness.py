from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class CheckinCreate(BaseModel):
    mood_score: int = Field(7, ge=0, le=10)
    stress_score: int = Field(5, ge=0, le=10)
    energy_score: int = Field(6, ge=0, le=10)
    sleep_hours: float = Field(7.0, ge=0.0, le=24.0)
    sleep_quality: int = Field(7, ge=0, le=10)
    academic_stress: int = Field(5, ge=0, le=10)
    social_connection: int = Field(6, ge=0, le=10)
    journal_text: Optional[str] = None

class CheckinRead(BaseModel):
    id: str
    student_id: str
    mood_score: int
    stress_score: int
    energy_score: int
    sleep_hours: float
    sleep_quality: int
    academic_stress: int
    social_connection: int
    sentiment_score: float
    emotion_label: str
    wellness_score: float
    risk_indicator: float = Field(3.0, ge=1.0, le=10.0)
    risk_level: str
    created_at: datetime

    class Config:
        from_attributes = True

class CheckinResponse(BaseModel):
    checkin_id: str
    wellness_score: float
    risk_indicator: Optional[float] = Field(None, ge=1.0, le=10.0)
    risk_level: str
    emotion: str
    insights: List[str]
    recommended_exercise: Optional[Dict[str, Any]] = None

class TrendDataPoint(BaseModel):
    date: str
    mood: float
    stress: float
    energy: float
    sleep: float
    wellness_score: float

class TrendsResponse(BaseModel):
    period: str
    data: List[TrendDataPoint]

class InsightItem(BaseModel):
    title: str
    observation: str
    category: str
    action_prompt: Optional[str] = None
