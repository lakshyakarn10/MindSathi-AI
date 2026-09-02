from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel

class RiskFactorsDecomposition(BaseModel):
    mood: int = 20
    stress: int = 16
    sleep: int = 12
    journal: int = 16
    checkin: int = 12
    behavioral_change: int = 0
    crisis_indicator: int = 0

class RiskProfileResponse(BaseModel):
    wellness_score: float = 74.0
    risk_indicator: float = 3.0
    risk_score: int = 28
    risk_level: str = "low"
    trend: str = "STABLE"
    sudden_change: bool = False
    behavioral_changes: Optional[Dict[str, Any]] = None
    risk_factors: Optional[List[str]] = None
    factors: Optional[RiskFactorsDecomposition] = None
    disclaimer: str = "Observational wellness indicator only. Not a medical or clinical diagnosis."

class EscalationCaseRead(BaseModel):
    id: str
    student_id: str
    anonymous_id: Optional[str] = None
    assigned_counselor_id: Optional[str] = None
    assigned_counselor_name: Optional[str] = None
    risk_level: str
    risk_score: int
    trigger_reason: str
    status: str
    factors: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class EscalationCaseUpdate(BaseModel):
    status: Optional[str] = None
    assigned_counselor_id: Optional[str] = None
    notes: Optional[str] = None
