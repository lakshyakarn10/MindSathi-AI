from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import require_student
from app.models.user import User
from app.models.wellness import WellnessCheckin
from app.schemas.wellness import CheckinCreate, CheckinResponse, CheckinRead
from app.services.wellness_service import record_checkin
from app.core.exceptions import NotFoundError

router = APIRouter(prefix="/checkins", tags=["Wellness Check-ins"])

@router.post("", response_model=CheckinResponse, summary="Submit Daily Wellness Check-in")
def submit_checkin(
    data: CheckinCreate,
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    student = current_user.student_profile
    if not student:
        raise NotFoundError("Student profile not found.")
    return record_checkin(db, student.id, data)

@router.get("/today", summary="Get Today's Check-in")
def get_today_checkin(
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    student = current_user.student_profile
    if not student:
        raise NotFoundError("Student profile not found.")

    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    latest = db.query(WellnessCheckin).filter(
        WellnessCheckin.student_id == student.id,
        WellnessCheckin.created_at >= today_start
    ).order_by(WellnessCheckin.created_at.desc()).first()

    if not latest:
        # Fallback to most recent
        latest = db.query(WellnessCheckin).filter(
            WellnessCheckin.student_id == student.id
        ).order_by(WellnessCheckin.created_at.desc()).first()

    if not latest:
        return {"success": True, "has_checked_in_today": False, "data": None}

    return {
        "success": True,
        "has_checked_in_today": True,
        "data": {
            "id": latest.id,
            "mood_score": latest.mood_score,
            "stress_score": latest.stress_score,
            "energy_score": latest.energy_score,
            "sleep_hours": latest.sleep_hours,
            "sleep_quality": latest.sleep_quality,
            "wellness_score": latest.wellness_score,
            "risk_indicator": latest.risk_indicator,
            "emotion_label": latest.emotion_label,
            "risk_level": latest.risk_level.value,
            "created_at": latest.created_at
        }
    }

@router.get("", summary="Get Historical Check-ins")
def get_checkin_history(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    student = current_user.student_profile
    if not student:
        raise NotFoundError("Student profile not found.")

    query = db.query(WellnessCheckin).filter(WellnessCheckin.student_id == student.id)
    total = query.count()
    items = query.order_by(WellnessCheckin.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    data = []
    for r in items:
        data.append({
            "id": r.id,
            "mood_score": r.mood_score,
            "stress_score": r.stress_score,
            "energy_score": r.energy_score,
            "sleep_hours": r.sleep_hours,
            "wellness_score": r.wellness_score,
            "risk_indicator": r.risk_indicator,
            "emotion_label": r.emotion_label,
            "risk_level": r.risk_level.value,
            "created_at": r.created_at
        })

    return {
        "success": True,
        "data": data,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit
        }
    }
