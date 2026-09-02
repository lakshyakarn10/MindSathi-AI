from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

# Exercise Schemas
class ExerciseRead(BaseModel):
    id: str
    title: str
    description: str
    category: str
    duration_seconds: int
    instructions: str
    recommended_for: str
    active: bool

    class Config:
        from_attributes = True

class ExerciseCompleteRequest(BaseModel):
    before_stress: float = Field(7.0, ge=0.0, le=10.0)
    after_stress: float = Field(4.5, ge=0.0, le=10.0)
    duration_seconds: int = 120

class ExerciseCompletionRead(BaseModel):
    id: str
    exercise_title: str
    before_stress: float
    after_stress: float
    stress_delta: float
    duration_seconds: int
    created_at: datetime

# Notification Schemas
class NotificationRead(BaseModel):
    id: str
    user_id: str
    type: str
    title: str
    message: str
    reference_type: Optional[str] = None
    reference_id: Optional[str] = None
    link_tab: Optional[str] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Message Schemas
class MessageSendRequest(BaseModel):
    conversation_id: Optional[str] = None
    receiver_id: Optional[str] = None
    content: str

class MessageRead(BaseModel):
    id: str
    conversation_id: str
    sender_id: str
    sender_role: str
    content: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ConversationRead(BaseModel):
    id: str
    student_id: str
    student_anonymous_id: Optional[str] = None
    counselor_id: Optional[str] = None
    counselor_name: Optional[str] = None
    last_message: Optional[str] = None
    updated_at: datetime
    messages: List[MessageRead] = []

    class Config:
        from_attributes = True

# AI Companion Schemas
class CompanionChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None

class CompanionChatResponse(BaseModel):
    conversation_id: Optional[str] = None
    response: str
    suggested_topics: List[str] = []
    recommended_exercise: Optional[Dict[str, Any]] = None
    should_offer_counselor: bool = False
    crisis_detected: bool = False
    observations: Optional[Dict[str, Any]] = None
    model_used: Optional[str] = None
    is_fallback: bool = False

# Consent Schemas
class ConsentUpdate(BaseModel):
    consent_type: str
    granted: bool

class ConsentRead(BaseModel):
    id: str
    consent_type: str
    granted: bool
    version: str
    granted_at: datetime
    revoked_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Analytics Schemas
class AdminOverviewAnalytics(BaseModel):
    participating_students: int
    average_wellness: int
    elevated_stress_percentage: int
    checkin_participation: int
    counseling_sessions: int
    privacy_banner: str = "ISO-27001 & FERPA Compliant · Zero Individual Tracking · Minimum k-Anonymity (k=15)"

class DepartmentAnalyticsItem(BaseModel):
    department: str
    cohort_size: int
    average_wellness: float
    stress_index: float
    visible: bool = True
    privacy_note: Optional[str] = None

class StressHotspotsResponse(BaseModel):
    academic_workload: int = 42
    exam_pressure: int = 38
    placement_anxiety: int = 27
    sleep_disruptions: int = 31
    exam_period_stress: int = 78
    normal_period_stress: int = 41
    insights: List[str]

class InstitutionalRecommendation(BaseModel):
    id: str
    title: str
    recommendation: str
    evidence_driver: str
    confidence: float
    is_ai_generated: bool = True
    disclaimer: str = "AI-generated institutional recommendation based on aggregate cohort trends."

class AdminReportCreate(BaseModel):
    type: str = "monthly_wellness" # monthly_wellness, stress_hotspots, counseling_utilization, intervention_impact
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    department: Optional[str] = "All Departments"

class AdminReportRead(BaseModel):
    id: str
    title: str
    type: str
    generated_at: datetime
    summary: str
    metrics: Dict[str, Any]
    department_breakdown: List[Dict[str, Any]]
    recommendations: List[str]
