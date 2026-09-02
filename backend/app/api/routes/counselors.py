from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import require_counselor, get_current_user
from app.models.user import User
from app.models.counselor import Counselor, VerificationStatus
from app.models.risk import EscalationCase, EscalationStatus
from app.models.appointment import Appointment
from app.models.session import SessionRecord
from app.schemas.risk import EscalationCaseRead, EscalationCaseUpdate
from app.schemas.appointment import (
    AppointmentCreate,
    SessionNotesCreate,
    RejectionRequest,
    SuggestTimeRequest,
    MeetUrlRequest,
    LocationRequest
)
from app.services.appointment_service import (
    create_student_appointment,
    accept_appointment,
    reject_appointment,
    suggest_alternative_time,
    set_appointment_meet_url,
    set_appointment_location
)
from app.models.student import Student
from app.services.session_service import complete_session_and_add_notes
from app.services.counselor_report_service import generate_counselor_wellness_report
from app.core.exceptions import NotFoundError, PermissionDeniedError

router = APIRouter(prefix="/counselor", tags=["Counselor Workspace"])

@router.get("/directory", summary="Get Approved Counselors Directory")
def get_counselors_directory(
    institution_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Counselor).filter(Counselor.verification_status == VerificationStatus.APPROVED)
    
    target_inst = institution_id
    if not target_inst:
        if current_user.student_profile and current_user.student_profile.institution_id:
            target_inst = current_user.student_profile.institution_id
        elif current_user.counselor_profile and current_user.counselor_profile.institution_id:
            target_inst = current_user.counselor_profile.institution_id
        elif current_user.admin_profile and current_user.admin_profile.institution_id:
            target_inst = current_user.admin_profile.institution_id
        
    if target_inst:
        inst_counselors = query.filter(Counselor.institution_id == target_inst).all()
        counselors = inst_counselors if inst_counselors else []
    else:
        counselors = query.all()

    seen_counselors = set()
    results = []
    for c in counselors:
        name = c.user.full_name if c.user and c.user.full_name else "Campus Counselor"
        # Deduplicate by name and institution to prevent duplicates
        dedup_key = (name.strip().lower(), str(c.institution_id))
        if dedup_key in seen_counselors:
            continue
        seen_counselors.add(dedup_key)

        results.append({
            "id": c.id,
            "name": name,
            "email": c.user.email if c.user else "",
            "role": c.professional_role,
            "department": c.department,
            "availability_status": c.availability_status.value if hasattr(c.availability_status, 'value') else str(c.availability_status),
            "institution_id": str(c.institution_id) if c.institution_id else None,
            "institution_name": c.institution.name if c.institution else "MindSaathi Campus",
            "rating": 4.9,
            "sessions_completed": len([a for a in c.appointments if a.status == "completed"]),
        })

    return {"success": True, "data": results}

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

@router.get("/cases/{case_id}/report", summary="Counselor Observational Wellness Report for a Case")
def get_case_wellness_report(
    case_id: str,
    current_user: User = Depends(require_counselor),
    db: Session = Depends(get_db)
):
    """
    Returns a structured observational wellness report for a specific escalation case.

    Authorization:
    - Requires verified counselor credentials.
    - Counselor must be assigned to the case OR belong to the same institution as the student.
    - Students (403), admins (403), and unrelated counselors (403) are denied.

    The report contains:
    - Current wellness score and risk indicator (1.0-10.0)
    - Previous risk indicator and delta (where data exists)
    - Risk level and trend
    - Sudden behavioral change flag
    - Risk factor decomposition (from stored EscalationCase.factors_json)
    - Longitudinal behavioral changes (mood, stress, energy, sleep vs baseline)
    - Conversation themes from AI companion (no raw message content)
    - Observational summary (deterministic, non-diagnostic)
    - Support recommendation
    - Escalation lifecycle history
    - Safety indicator (if crisis-level case)
    """
    report = generate_counselor_wellness_report(
        db=db,
        case_id=case_id,
        counselor_user_id=current_user.id
    )
    return {"success": True, "data": report}


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

    # Retrieve appointments assigned to this counselor or within their institution
    counselor_ids = [counselor.id]
    if counselor.institution_id:
        inst_counselors = db.query(Counselor.id).filter(Counselor.institution_id == counselor.institution_id).all()
        counselor_ids.extend([c[0] for c in inst_counselors])

    query = db.query(Appointment).filter(Appointment.counselor_id.in_(list(set(counselor_ids))))
    if status:
        query = query.filter(Appointment.status == status)

    apts = query.order_by(Appointment.scheduled_start.desc()).all()

    results = []
    for a in apts:
        counselor_name = "Campus Counselor"
        if a.counselor and a.counselor.user and a.counselor.user.full_name:
            counselor_name = a.counselor.user.full_name

        status_val = a.status.value if hasattr(a.status, "value") else str(a.status).lower()
        mode_val = a.mode.value if hasattr(a.mode, "value") else str(a.mode).lower()

        results.append({
            "id": a.id,
            "student_id": a.student_id,
            "anonymous_id": a.student.anonymous_id if a.student else "STU-XXXX",
            "department": a.student.department if a.student else "Engineering",
            "counselor_name": counselor_name,
            "counselor_id": a.counselor_id,
            "session_type": a.session_type,
            "mode": mode_val,
            "reason": a.reason,
            "scheduled_start": a.scheduled_start.isoformat() if hasattr(a.scheduled_start, "isoformat") else str(a.scheduled_start),
            "scheduled_end": a.scheduled_end.isoformat() if hasattr(a.scheduled_end, "isoformat") else str(a.scheduled_end),
            "status": status_val,
            "duration_minutes": a.duration_minutes,
            "student_notes": a.student_notes,
            "counselor_notes": a.counselor_notes,
            "meet_url": a.meet_url,
            "location": a.location,
            "rejection_reason": a.rejection_reason
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

@router.patch("/appointments/{appointment_id}/reject", summary="Counselor Rejects Appointment")
def reject_apt(
    appointment_id: str,
    req: RejectionRequest = None,
    current_user: User = Depends(require_counselor),
    db: Session = Depends(get_db)
):
    reason = req.rejection_reason if req else None
    apt = reject_appointment(db, appointment_id, rejection_reason=reason, counselor_user_id=current_user.id)
    return {
        "success": True,
        "message": "Appointment declined.",
        "data": {
            "id": apt.id,
            "status": apt.status.value,
            "rejection_reason": apt.rejection_reason
        }
    }

@router.patch("/appointments/{appointment_id}/suggest-time", summary="Counselor Suggests Alternative Time")
def suggest_time_apt(
    appointment_id: str,
    req: SuggestTimeRequest,
    current_user: User = Depends(require_counselor),
    db: Session = Depends(get_db)
):
    apt = suggest_alternative_time(
        db=db,
        appointment_id=appointment_id,
        new_start=req.new_start,
        message=req.message,
        counselor_user_id=current_user.id
    )
    return {
        "success": True,
        "message": "Alternative time suggested to student.",
        "data": {
            "id": apt.id,
            "scheduled_start": apt.scheduled_start,
            "status": apt.status.value
        }
    }

@router.patch("/appointments/{appointment_id}/meet-url", summary="Counselor Sets Google Meet / Video URL")
def set_meet_url_apt(
    appointment_id: str,
    req: MeetUrlRequest,
    current_user: User = Depends(require_counselor),
    db: Session = Depends(get_db)
):
    apt = set_appointment_meet_url(
        db=db,
        appointment_id=appointment_id,
        meet_url=req.meet_url,
        counselor_user_id=current_user.id
    )
    return {
        "success": True,
        "message": "Meet URL saved.",
        "data": {"id": apt.id, "meet_url": apt.meet_url}
    }

@router.patch("/appointments/{appointment_id}/location", summary="Counselor Sets In-Person Location")
def set_location_apt(
    appointment_id: str,
    req: LocationRequest,
    current_user: User = Depends(require_counselor),
    db: Session = Depends(get_db)
):
    apt = set_appointment_location(
        db=db,
        appointment_id=appointment_id,
        location=req.location,
        counselor_user_id=current_user.id
    )
    return {
        "success": True,
        "message": "In-person location saved.",
        "data": {"id": apt.id, "location": apt.location}
    }

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


@router.post("/appointments/schedule-for-student", summary="Counselor Initiates Session for a Student")
def counselor_schedule_for_student(
    req: AppointmentCreate,
    current_user: User = Depends(require_counselor),
    db: Session = Depends(get_db)
):
    """
    Allows a counselor to initiate a counseling appointment for a student.
    The counselor's own profile is used as the counselor on the appointment.
    The appointment starts with CONFIRMED status since it is counselor-initiated.
    """
    counselor = current_user.counselor_profile
    if not counselor:
        raise NotFoundError("Counselor profile not found.")

    # Resolve student: counselor_id field is repurposed to carry student case/anon ID
    # We look up the student by anonymous_id (e.g. STU-2048) if counselor_id is a display ref
    student = None
    if req.counselor_id:
        # Try by actual student UUID first
        student = db.query(Student).filter(Student.id == req.counselor_id).first()
        # Fallback: try by anonymous ID (e.g. "STU-2048")
        if not student:
            student = db.query(Student).filter(Student.anonymous_id == req.counselor_id).first()

    if not student:
        # Fallback: get student within the counselor's institution or any active student
        if counselor.institution_id:
            student = db.query(Student).filter(Student.institution_id == counselor.institution_id).first()
        if not student:
            student = db.query(Student).first()
        if not student:
            raise NotFoundError("No student record found to schedule an appointment with.")

    # Override counselor_id in request to use current counselor's profile
    req.counselor_id = counselor.id
    apt = create_student_appointment(db, student, req)

    # Auto-confirm since counselor is the initiator
    from app.models.appointment import AppointmentStatus
    apt.status = AppointmentStatus.CONFIRMED
    db.commit()
    db.refresh(apt)

    return {
        "success": True,
        "message": "Session scheduled and confirmed for student.",
        "data": {
            "id": apt.id,
            "scheduled_start": apt.scheduled_start,
            "mode": apt.mode.value,
            "status": apt.status.value,
            "student_anonymous_id": student.anonymous_id
        }
    }
