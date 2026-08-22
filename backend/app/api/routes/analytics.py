from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import require_admin
from app.models.user import User
from app.schemas.analytics import AdminOverviewAnalytics, DepartmentAnalyticsItem, StressHotspotsResponse, InstitutionalRecommendation
from app.services.analytics_service import (
    get_admin_overview_analytics, get_department_analytics,
    get_stress_hotspots, get_institutional_recommendations
)

router = APIRouter(prefix="/admin/analytics", tags=["Institutional Admin Analytics"])

@router.get("/overview", response_model=AdminOverviewAnalytics, summary="Get Campus Wellness Overview (Aggregate)")
def overview_analytics(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    return get_admin_overview_analytics(db)

@router.get("/departments", response_model=List[DepartmentAnalyticsItem], summary="Get Departmental Analytics (k-Anonymity Protected)")
def department_analytics(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    return get_department_analytics(db)

@router.get("/stress-hotspots", response_model=StressHotspotsResponse, summary="Get Campus Stress Hotspots & Timeline Trends")
def stress_hotspots(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    return get_stress_hotspots(db)

@router.get("/recommendations", response_model=List[InstitutionalRecommendation], summary="Get AI Institutional Policy Recommendations")
def recommendations(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    return get_institutional_recommendations(db)
