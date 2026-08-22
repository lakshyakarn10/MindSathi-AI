from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_student
from app.models.user import User
from app.schemas.appointment import AppointmentCreate, RescheduleRequest, CancelRequest
from app.services.appointment_service import create_student_appointment, reschedule_appointment, cancel_appointment
from app.core.exceptions import NotFoundError

router = APIRouter(prefix="/appointments", tags=["Appointments Management"])

@router.post("", summary="Student Requests or Schedules Counseling Session")
def request_session(
    req: AppointmentCreate,
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    student = current_user.student_profile
    if not student:
        raise NotFoundError("Student profile not found.")

    apt = create_student_appointment(db, student, req)
    return {
        "success": True,
        "message": "Counseling session successfully scheduled and confirmed.",
        "data": {
            "id": apt.id,
            "scheduled_start": apt.scheduled_start,
            "mode": apt.mode.value,
            "status": apt.status.value
        }
    }

@router.patch("/{appointment_id}/reschedule", summary="Reschedule Appointment")
def reschedule(
    appointment_id: str,
    req: RescheduleRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    apt = reschedule_appointment(
        db,
        appointment_id=appointment_id,
        req=req,
        actor_user_id=current_user.id,
        actor_role=current_user.role.value
    )
    return {"success": True, "message": "Appointment rescheduled.", "data": {"id": apt.id, "new_start": apt.scheduled_start}}

@router.patch("/{appointment_id}/cancel", summary="Cancel Appointment")
def cancel(
    appointment_id: str,
    req: CancelRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    apt = cancel_appointment(
        db,
        appointment_id=appointment_id,
        reason=req.reason or "Cancelled by user",
        actor_user_id=current_user.id,
        actor_role=current_user.role.value
    )
    return {"success": True, "message": "Appointment cancelled.", "data": {"id": apt.id, "status": apt.status.value}}
