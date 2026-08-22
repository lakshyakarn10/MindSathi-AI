from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import require_admin
from app.models.user import User
from app.schemas.analytics import AdminReportCreate, AdminReportRead
from app.services.report_service import generate_admin_report

router = APIRouter(prefix="/admin/reports", tags=["Institutional Reports"])

@router.post("", response_model=AdminReportRead, summary="Generate Aggregate Institutional Report")
def create_report(
    req: AdminReportCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    return generate_admin_report(db, req)

@router.get("", summary="Get Past Institutional Reports List")
def list_reports(current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    # Generate standard catalog
    rep1 = generate_admin_report(db, AdminReportCreate(type="monthly_wellness"))
    rep2 = generate_admin_report(db, AdminReportCreate(type="stress_hotspots"))
    return {"success": True, "data": [rep1, rep2]}

@router.get("/{report_id}/export/csv", summary="Export Report CSV Dataset (Simulated)")
def export_csv(report_id: str, current_user: User = Depends(require_admin)):
    csv_data = "Department,Cohort_Size,Wellness_Score,Stress_Index\n"
    csv_data += "Computer Science,2431,72.4,5.4\n"
    csv_data += "Electronics,1120,70.8,5.8\n"
    csv_data += "Mechanical,580,75.1,4.8\n"
    csv_data += "Civil,150,73.0,5.0\n"

    return Response(content=csv_data, media_type="text/csv", headers={"Content-Disposition": f"attachment; filename={report_id}.csv"})
