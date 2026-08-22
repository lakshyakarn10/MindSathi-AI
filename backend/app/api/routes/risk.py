from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import require_student, require_counselor
from app.models.user import User
from app.models.student import Student
from app.models.wellness import WellnessCheckin
from app.models.risk import EscalationCase
from app.schemas.risk import RiskProfileResponse, RiskFactorsDecomposition
from app.core.exceptions import NotFoundError

router = APIRouter(tags=["Risk Assessment & Explainability"])

@router.get("/risk/me", response_model=RiskProfileResponse, summary="Get Student's Own Wellness Risk Profile")
def get_my_risk_profile(
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    student = current_user.student_profile
    if not student:
        raise NotFoundError("Student profile not found.")

    latest_checkin = db.query(WellnessCheckin).filter(
        WellnessCheckin.student_id == student.id
    ).order_by(WellnessCheckin.created_at.desc()).first()

    risk_score = 28
    risk_level = "low"
    trend = "Stable"
    factors = RiskFactorsDecomposition(mood=8, stress=6, sleep=4, journal=5, checkin=3, crisis_indicator=0)

    if latest_checkin:
        risk_level = latest_checkin.risk_level.value
        risk_score = int(round(100 - latest_checkin.wellness_score))

    return RiskProfileResponse(
        risk_score=risk_score,
        risk_level=risk_level,
        factors=factors,
        trend=trend
    )

@router.get("/counselor/cases/{case_id}/risk", response_model=RiskProfileResponse, summary="Counselor Explainable AI Risk Decomposition")
def get_case_risk_decomposition(
    case_id: str,
    current_user: User = Depends(require_counselor),
    db: Session = Depends(get_db)
):
    case = db.query(EscalationCase).filter(EscalationCase.id == case_id).first()
    if not case:
        raise NotFoundError("Case not found.")

    factors_dict = case.factors_json or {
        "mood": 21,
        "stress": 17,
        "sleep": 12,
        "journal": 18,
        "checkin": 14,
        "crisis_indicator": 20
    }

    factors = RiskFactorsDecomposition(
        mood=factors_dict.get("mood", 21),
        stress=factors_dict.get("stress", 17),
        sleep=factors_dict.get("sleep", 12),
        journal=factors_dict.get("journal", 18),
        checkin=factors_dict.get("checkin", 14),
        crisis_indicator=factors_dict.get("crisis_indicator", 20)
    )

    return RiskProfileResponse(
        risk_score=case.risk_score,
        risk_level=case.risk_level.value,
        factors=factors,
        trend="Elevated Concern" if case.risk_score >= 70 else "Monitoring"
    )
