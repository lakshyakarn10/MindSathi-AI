from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import require_counselor
from app.models.user import User
from app.models.risk import EscalationCase, EscalationStatus
from app.models.appointment import Appointment
from app.models.session import SessionRecord
from app.schemas.risk import EscalationCaseRead, EscalationCaseUpdate
from app.schemas.appointment import SessionNotesCreate
from app.services.appointment_service import accept_appointment
from app.services.session_service import complete_session_and_add_notes
from app.core.exceptions import NotFoundError

router = APIRouter(prefix="/counselor", tags=["Counselor Workspace"])

@router.get("/cases", summary="Get Counselor Priority Case Queue")
def get_cases(
    risk_level: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(require_counselor),
    db: Session = Depends(get_db)
):
    query = db.query(EscalationCase)

    if risk_level:
        query = query.filter(EscalationCase.risk_level == risk_level.lower())
    if status:
        query = query.filter(EscalationCase.status == status.lower())

    cases = query.order_by(EscalationCase.risk_score.desc(), EscalationCase.created_at.desc()).all()

    results = []
    for c in cases:
        anon_id = c.student.anonymous_id if c.student else "STU-UNKNOWN"
        if search and search.lower() not in anon_id.lower():
            continue

        counselor_name = c.assigned_counselor.user.full_name if c.assigned_counselor and c.assigned_counselor.user else "Unassigned"

        results.append({
            "id": c.id,
            "student_id": c.student_id,
            "anonymous_id": anon_id,
            "assigned_counselor_id": c.assigned_counselor_id,
            "assigned_counselor_name": counselor_name,
            "risk_level": c.risk_level.value,
            "risk_score": c.risk_score,
            "trigger_reason": c.trigger_reason,
            "status": c.status.value,
            "factors": c.factors_json,
            "notes": c.notes,
            "created_at": c.created_at,
            "updated_at": c.updated_at
        })

    return {"success": True, "data": results}

@router.get("/cases/{case_id}", summary="Get Case Details")
def get_case_detail(
    case_id: str,
    current_user: User = Depends(require_counselor),
    db: Session = Depends(get_db)
):
    case = db.query(EscalationCase).filter(EscalationCase.id == case_id).first()
    if not case:
        raise NotFoundError("Case not found.")

    return {
        "success": True,
        "data": {
            "id": case.id,
            "student_id": case.student_id,
            "anonymous_id": case.student.anonymous_id if case.student else "STU-UNKNOWN",
            "department": case.student.department if case.student else "General",
            "risk_level": case.risk_level.value,
            "risk_score": case.risk_score,
            "trigger_reason": case.trigger_reason,
            "status": case.status.value,
            "factors": case.factors_json,
            "notes": case.notes,
            "created_at": case.created_at
        }
    }

@router.patch("/cases/{case_id}", summary="Update Case Lifecycle Status")
def update_case(
    case_id: str,
    req: EscalationCaseUpdate,
    current_user: User = Depends(require_counselor),
    db: Session = Depends(get_db)
):
    case = db.query(EscalationCase).filter(EscalationCase.id == case_id).first()
    if not case:
        raise NotFoundError("Case not found.")

    if req.status:
        case.status = req.status
    if req.assigned_counselor_id:
        case.assigned_counselor_id = req.assigned_counselor_id
    if req.notes:
        case.notes = req.notes

    db.commit()
    db.refresh(case)
    return {"success": True, "message": "Case updated successfully.", "data": {"status": case.status.value}}

@router.get("/appointments", summary="Get Counselor Appointments")
def get_counselor_appointments(
    status: Optional[str] = Query(None),
    current_user: User = Depends(require_counselor),
    db: Session = Depends(get_db)
):
    counselor = current_user.counselor_profile
    if not counselor:
        raise NotFoundError("Counselor profile not found.")

    query = db.query(Appointment).filter(Appointment.counselor_id == counselor.id)
    if status:
        query = query.filter(Appointment.status == status)

    apts = query.order_by(Appointment.scheduled_start.asc()).all()

    results = []
    for a in apts:
        results.append({
            "id": a.id,
            "student_id": a.student_id,
            "anonymous_id": a.student.anonymous_id if a.student else "STU-XXXX",
            "department": a.student.department if a.student else "Engineering",
            "session_type": a.session_type,
            "mode": a.mode.value,
            "reason": a.reason,
            "scheduled_start": a.scheduled_start,
            "scheduled_end": a.scheduled_end,
            "status": a.status.value,
            "student_notes": a.student_notes,
            "counselor_notes": a.counselor_notes
        })

    return {"success": True, "data": results}

@router.patch("/appointments/{appointment_id}/accept", summary="Counselor Accepts Appointment")
def accept_apt(
    appointment_id: str,
    current_user: User = Depends(require_counselor),
    db: Session = Depends(get_db)
):
    apt = accept_appointment(db, appointment_id, counselor_user_id=current_user.id)
    return {"success": True, "message": "Appointment confirmed.", "data": {"id": apt.id, "status": apt.status.value}}

@router.patch("/appointments/{appointment_id}/complete", summary="Counselor Completes Session and Records Notes")
def complete_apt(
    appointment_id: str,
    notes: SessionNotesCreate,
    current_user: User = Depends(require_counselor),
    db: Session = Depends(get_db)
):
    record = complete_session_and_add_notes(db, appointment_id, notes, counselor_user_id=current_user.id)
    return {
        "success": True,
        "message": "Session completed and summary notes recorded.",
        "data": {"session_record_id": record.id}
    }

@router.get("/sessions", summary="Get Completed Sessions History")
def get_sessions_history(
    current_user: User = Depends(require_counselor),
    db: Session = Depends(get_db)
):
    counselor = current_user.counselor_profile
    if not counselor:
        raise NotFoundError("Counselor profile not found.")

    apts = db.query(Appointment).filter(
        Appointment.counselor_id == counselor.id,
        Appointment.status == "completed"
    ).order_by(Appointment.scheduled_start.desc()).all()

    results = []
    for a in apts:
        rec = a.session_record
        results.append({
            "appointment_id": a.id,
            "anonymous_id": a.student.anonymous_id if a.student else "STU-XXXX",
            "date": a.scheduled_start.strftime("%b %d, %Y"),
            "mode": a.mode.value,
            "duration": f"{a.duration_minutes} min",
            "topics": rec.discussion_topics if rec else "General academic discussion",
            "summary": rec.summary if rec else "Session completed with counselor.",
            "recommendations": rec.recommendations if rec else "Maintain steady daily routines."
        })

    return {"success": True, "data": results}
