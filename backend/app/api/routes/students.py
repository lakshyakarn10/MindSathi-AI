from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import require_student
from app.models.user import User
from app.models.student import Student
from app.models.appointment import Appointment
from app.models.session import SessionRecord
from app.schemas.student import StudentRead, StudentUpdate, OnboardingRequest
from app.schemas.appointment import AppointmentRead, SessionRecordRead
from app.core.exceptions import NotFoundError

router = APIRouter(prefix="/students", tags=["Students"])

@router.get("/me", summary="Get Current Student Profile")
def get_student_profile(current_user: User = Depends(require_student)):
    student = current_user.student_profile
    if not student:
        raise NotFoundError("Student profile not found.")
    return {
        "success": True,
        "data": {
            "id": student.id,
            "anonymous_id": student.anonymous_id,
            "full_name": current_user.full_name,
            "email": current_user.email,
            "department": student.department,
            "year_of_study": student.year_of_study,
            "preferred_language": student.preferred_language,
            "timezone": student.timezone,
            "onboarding_completed": student.onboarding_completed,
            "created_at": student.created_at
        }
    }

@router.patch("/me", summary="Update Current Student Profile")
def update_student_profile(
    req: StudentUpdate,
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    student = current_user.student_profile
    if not student:
        raise NotFoundError("Student profile not found.")

    if req.department is not None:
        student.department = req.department
    if req.year_of_study is not None:
        student.year_of_study = req.year_of_study
    if req.preferred_language is not None:
        student.preferred_language = req.preferred_language
    if req.timezone is not None:
        student.timezone = req.timezone

    db.commit()
    db.refresh(student)
    return {"success": True, "message": "Profile updated successfully."}

@router.post("/onboarding", summary="Complete Student Onboarding")
def complete_onboarding(
    req: OnboardingRequest,
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    student = current_user.student_profile
    if not student:
        raise NotFoundError("Student profile not found.")

    student.onboarding_completed = True
    student.preferred_language = req.preferred_language
    db.commit()

    return {
        "success": True,
        "onboarding_completed": True,
        "message": "Onboarding completed. Welcome to your MindSaathi wellness space!"
    }

@router.get("/me/appointments", summary="Get Current Student's Appointments")
def get_my_appointments(
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    student = current_user.student_profile
    if not student:
        raise NotFoundError("Student profile not found.")

    apts = db.query(Appointment).filter(
        Appointment.student_id == student.id
    ).order_by(Appointment.scheduled_start.desc()).all()

    results = []
    for a in apts:
        counselor_name = a.counselor.user.full_name if a.counselor and a.counselor.user else "Campus Counselor"
        results.append({
            "id": a.id,
            "counselor_name": f"Dr. {counselor_name}",
            "counselor_role": a.counselor.professional_role if a.counselor else "Counselor",
            "session_type": a.session_type,
            "mode": a.mode.value,
            "reason": a.reason,
            "scheduled_start": a.scheduled_start,
            "scheduled_end": a.scheduled_end,
            "duration_minutes": a.duration_minutes,
            "status": a.status.value,
            "student_notes": a.student_notes
        })

    return {"success": True, "data": results}

@router.get("/me/sessions", summary="Get Current Student's Completed Sessions")
def get_my_sessions(
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    student = current_user.student_profile
    if not student:
        raise NotFoundError("Student profile not found.")

    completed_apts = db.query(Appointment).filter(
        Appointment.student_id == student.id,
        Appointment.status == "completed"
    ).all()

    results = []
    for a in completed_apts:
        rec = a.session_record
        results.append({
            "appointment_id": a.id,
            "counselor_name": a.counselor.user.full_name if a.counselor and a.counselor.user else "Campus Counselor",
            "date": a.scheduled_start.strftime("%b %d, %Y"),
            "mode": a.mode.value,
            "summary": rec.summary if rec else "Session completed with counselor.",
            "recommendations": rec.recommendations if rec else "Maintain steady daily routines."
        })

    return {"success": True, "data": results}
