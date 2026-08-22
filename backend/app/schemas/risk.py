from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel

class RiskFactorsDecomposition(BaseModel):
    mood: int = 21
    stress: int = 17
    sleep: int = 12
    journal: int = 18
    checkin: int = 14
    crisis_indicator: int = 20

class RiskProfileResponse(BaseModel):
    risk_score: int
    risk_level: str
    factors: RiskFactorsDecomposition
    trend: str
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
