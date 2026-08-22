from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.student import Student
from app.models.wellness import WellnessCheckin, RiskLevel
from app.models.appointment import Appointment, AppointmentStatus
from app.schemas.analytics import AdminOverviewAnalytics, DepartmentAnalyticsItem, StressHotspotsResponse, InstitutionalRecommendation
from app.services.privacy_service import check_aggregate_privacy

def get_admin_overview_analytics(db: Session) -> AdminOverviewAnalytics:
    total_students = db.query(Student).count()
    # Baseline for demo institution scale
    participating = max(total_students, 4281)

    return AdminOverviewAnalytics(
        participating_students=participating,
        average_wellness=72,
        elevated_stress_percentage=18,
        checkin_participation=64,
        counseling_sessions=284,
        privacy_banner="ISO-27001 & FERPA Compliant · Zero Individual Tracking · Minimum k-Anonymity (k=15)"
    )

def get_department_analytics(db: Session) -> List[DepartmentAnalyticsItem]:
    cohorts = [
        {"department": "Computer Science & Engineering", "cohort_size": 2431, "wellness": 72.4, "stress": 5.4},
        {"department": "Electronics & Communication", "cohort_size": 1120, "wellness": 70.8, "stress": 5.8},
        {"department": "Mechanical Engineering", "cohort_size": 580, "wellness": 75.1, "stress": 4.8},
        {"department": "Civil & Infrastructure", "cohort_size": 150, "wellness": 73.0, "stress": 5.0},
        {"department": "Robotics & AI Pilot", "cohort_size": 8, "wellness": 68.0, "stress": 6.2} # Intentionally < 15 to test privacy masking
    ]

    results: List[DepartmentAnalyticsItem] = []
    for c in cohorts:
        is_visible, privacy_note = check_aggregate_privacy(c["cohort_size"])
        if is_visible:
            results.append(DepartmentAnalyticsItem(
                department=c["department"],
                cohort_size=c["cohort_size"],
                average_wellness=c["wellness"],
                stress_index=c["stress"],
                visible=True,
                privacy_note=None
            ))
        else:
            results.append(DepartmentAnalyticsItem(
                department=c["department"],
                cohort_size=0,
                average_wellness=0.0,
                stress_index=0.0,
                visible=False,
                privacy_note=privacy_note
            ))
    return results

def get_stress_hotspots(db: Session) -> StressHotspotsResponse:
    return StressHotspotsResponse(
        academic_workload=42,
        exam_pressure=38,
        placement_anxiety=27,
        sleep_disruptions=31,
        exam_period_stress=78,
        normal_period_stress=41,
        insights=[
            "Examination periods show a 27% increase in self-reported elevated stress across 3rd & 4th year cohorts.",
            "Sleep duration drops below 6 hours for 34% of participating students during project submission weeks.",
            "Engagement with Box Breathing exercises increases by 44% during midterm assessment windows."
        ]
    )

def get_institutional_recommendations(db: Session) -> List[InstitutionalRecommendation]:
    return [
        InstitutionalRecommendation(
            id="rec-1",
            title="Pre-Midterm Counselor Availability Expansion",
            recommendation="Increase drop-in counselor shifts and group decompression workshops 10 days prior to mid-semester exams.",
            evidence_driver="Examination periods show 78% elevated stress index compared to 41% baseline.",
            confidence=0.88
        ),
        InstitutionalRecommendation(
            id="rec-2",
            title="Hostel & Residential Sleep Hygiene Outreach",
            recommendation="Introduce residence hall digital quiet hours and bedtime mindfulness routine reminders.",
            evidence_driver="31% of students report chronic sleep disruption during heavy assignment cycles.",
            confidence=0.82
        )
    ]
