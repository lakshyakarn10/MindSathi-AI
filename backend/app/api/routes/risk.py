from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import require_student, require_counselor
from app.models.user import User
from app.models.student import Student
from app.models.wellness import WellnessCheckin
from app.models.risk import EscalationCase
from app.schemas.risk import RiskProfileResponse, RiskFactorsDecomposition
from app.services.behavior_service import compute_baseline, detect_behavioral_changes
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

    wellness_score = 74.0
    risk_indicator = 3.0
    risk_score = 28
    risk_level = "low"
    trend = "STABLE"
    sudden_change = False
    behavioral_changes = {}
    risk_factor_labels = []

    if latest_checkin:
        wellness_score = latest_checkin.wellness_score
        risk_indicator = latest_checkin.risk_indicator
        risk_level = latest_checkin.risk_level.value
        risk_score = int(round(max(0, min(100, (risk_indicator - 1.0) / 9.0 * 100))))

        baseline = compute_baseline(db, student.id, window_days=14)
        current_metrics = {
            "mood_score": latest_checkin.mood_score,
            "stress_score": latest_checkin.stress_score,
            "energy_score": latest_checkin.energy_score,
            "sleep_hours": latest_checkin.sleep_hours,
            "wellness_score": latest_checkin.wellness_score
        }
        behavior_res = detect_behavioral_changes(baseline, current_metrics)
        trend = behavior_res.get("trend", "STABLE")
        sudden_change = behavior_res.get("sudden_change", False)
        behavioral_changes = behavior_res.get("changes", {})

        if latest_checkin.mood_score <= 4:
            risk_factor_labels.append("Low reported mood")
        if latest_checkin.stress_score >= 7:
            risk_factor_labels.append("Elevated academic & personal stress")
        if latest_checkin.sleep_hours < 6.0:
            risk_factor_labels.append("Reduced sleep duration")
        if sudden_change:
            risk_factor_labels.append("Sudden behavioral shift detected")
    else:
        risk_factor_labels = ["Baseline stable"]

    factors = RiskFactorsDecomposition(
        mood=int(round(max(0, 10 - (latest_checkin.mood_score if latest_checkin else 7)) * 2)),
        stress=int(round((latest_checkin.stress_score if latest_checkin else 5) * 1.6)),
        sleep=int(round(8.5 if latest_checkin and latest_checkin.sleep_hours < 6 else 3.0)),
        journal=int(round(max(0.0, (1.0 - (latest_checkin.sentiment_score if latest_checkin else 0.0)) * 8))),
        checkin=4,
        behavioral_change=15 if sudden_change else 0,
        crisis_indicator=0
    )

    return RiskProfileResponse(
        wellness_score=wellness_score,
        risk_indicator=risk_indicator,
        risk_score=risk_score,
        risk_level=risk_level,
        trend=trend,
        sudden_change=sudden_change,
        behavioral_changes=behavioral_changes,
        risk_factors=risk_factor_labels,
        factors=factors
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
        "mood": 20,
        "stress": 16,
        "sleep": 12,
        "journal": 16,
        "checkin": 12,
        "behavioral_change": 10,
        "crisis_indicator": 20
    }

    factors = RiskFactorsDecomposition(
        mood=factors_dict.get("mood", 20),
        stress=factors_dict.get("stress", 16),
        sleep=factors_dict.get("sleep", 12),
        journal=factors_dict.get("journal", 16),
        checkin=factors_dict.get("checkin", 12),
        behavioral_change=factors_dict.get("behavioral_change", 0),
        crisis_indicator=factors_dict.get("crisis_indicator", 0)
    )

    risk_indicator = round(max(1.0, min(10.0, 1.0 + (case.risk_score / 100.0) * 9.0)), 2)
    wellness_score = round(max(0.0, min(100.0, 100.0 - case.risk_score)), 1)

    return RiskProfileResponse(
        wellness_score=wellness_score,
        risk_indicator=risk_indicator,
        risk_score=case.risk_score,
        risk_level=case.risk_level.value,
        trend="Elevated Concern" if case.risk_score >= 70 else "Monitoring",
        sudden_change=bool(factors_dict.get("behavioral_change", 0) > 0),
        factors=factors
    )
