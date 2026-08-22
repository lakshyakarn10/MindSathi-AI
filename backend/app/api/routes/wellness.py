from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import require_student
from app.models.user import User
from app.schemas.wellness import TrendsResponse
from app.services.wellness_service import get_wellness_trends, get_wellness_insights
from app.core.exceptions import NotFoundError

router = APIRouter(prefix="/wellness", tags=["Wellness & Longitudinal Trends"])

@router.get("/trends", response_model=TrendsResponse, summary="Get Longitudinal Trends")
def get_trends(
    period: str = Query("7d", pattern="^(7d|30d|90d)$"),
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    student = current_user.student_profile
    if not student:
        raise NotFoundError("Student profile not found.")
    return get_wellness_trends(db, student.id, period=period)

@router.get("/insights", summary="Get Observational Wellness Insights")
def get_insights(
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    student = current_user.student_profile
    if not student:
        raise NotFoundError("Student profile not found.")
    insights = get_wellness_insights(db, student.id)
    return {"success": True, "data": insights}
