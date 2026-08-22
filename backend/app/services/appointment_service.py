from datetime import datetime, timedelta, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.appointment import Appointment, AppointmentStatus, SessionMode
from app.models.student import Student
from app.models.counselor import Counselor, VerificationStatus
from app.models.notification import Notification, NotificationType
from app.models.risk import EscalationCase, EscalationStatus
from app.models.audit import AuditLog
from app.schemas.appointment import AppointmentCreate, RescheduleRequest
from app.core.exceptions import NotFoundError, PermissionDeniedError

def create_student_appointment(db: Session, student: Student, req: AppointmentCreate) -> Appointment:
    # If counselor_id is not specified, assign first available approved counselor
    counselor_id = req.counselor_id
    if not counselor_id:
        counselor = db.query(Counselor).filter(Counselor.verification_status == VerificationStatus.APPROVED).first()
        if not counselor:
            raise NotFoundError("No verified campus counselor is currently available.")
        counselor_id = counselor.id
    else:
        counselor = db.query(Counselor).filter(Counselor.id == counselor_id).first()
        if not counselor:
            raise NotFoundError("Selected counselor not found.")

    scheduled_start = req.scheduled_start
    scheduled_end = scheduled_start + timedelta(minutes=req.duration_minutes)

    mode_enum = SessionMode.VIDEO
    if req.mode.lower() in ["phone", "confidential_phone"]:
        mode_enum = SessionMode.PHONE
    elif req.mode.lower() in ["in_person", "in-person"]:
        mode_enum = SessionMode.IN_PERSON

    apt = Appointment(
        student_id=student.id,
        counselor_id=counselor_id,
        session_type=req.session_type,
        mode=mode_enum,
        reason=req.reason,
        scheduled_start=scheduled_start,
        scheduled_end=scheduled_end,
        duration_minutes=req.duration_minutes,
        status=AppointmentStatus.CONFIRMED, # Confirmed for demo flow
        student_notes=req.student_notes
    )
    db.add(apt)
    db.flush()

    # Update case status if there is an active escalation case
    case = db.query(EscalationCase).filter(
        EscalationCase.student_id == student.id,
        EscalationCase.status.in_([EscalationStatus.NEW, EscalationStatus.REVIEWING, EscalationStatus.CONTACTED])
    ).first()
    if case:
        case.status = EscalationStatus.SESSION_SCHEDULED

    # Send Notification to Counselor
    notif_counselor = Notification(
        user_id=counselor.user_id,
        type=NotificationType.SESSION_SCHEDULED,
        title="New Counseling Session Scheduled",
        message=f"Session scheduled with {student.anonymous_id} on {scheduled_start.strftime('%b %d, %Y at %I:%M %p')}.",
        reference_type="appointment",
        reference_id=apt.id,
        link_tab="Appointments"
    )
    db.add(notif_counselor)

    # Send Confirmation Notification to Student
    notif_student = Notification(
        user_id=student.user_id,
        type=NotificationType.SESSION_SCHEDULED,
        title="Counseling Session Confirmed",
        message=f"Your session is confirmed for {scheduled_start.strftime('%b %d, %Y at %I:%M %p')}.",
        reference_type="appointment",
        reference_id=apt.id,
        link_tab="Support"
    )
    db.add(notif_student)

    # Audit log
    audit = AuditLog(
        actor_user_id=student.user_id,
        actor_role="student",
        action="STUDENT_REQUESTED_SESSION",
        resource_type="appointment",
        resource_id=apt.id
    )
    db.add(audit)

    db.commit()
    db.refresh(apt)
    return apt

def accept_appointment(db: Session, appointment_id: str, counselor_user_id: str) -> Appointment:
    apt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not apt:
        raise NotFoundError("Appointment not found.")

    apt.status = AppointmentStatus.CONFIRMED

    # Notify student
    student = db.query(Student).filter(Student.id == apt.student_id).first()
    if student:
        notif = Notification(
            user_id=student.user_id,
            type=NotificationType.SESSION_SCHEDULED,
            title="Counselor Confirmed Session",
            message=f"Dr. {apt.counselor.user.full_name or 'Counselor'} confirmed your session on {apt.scheduled_start.strftime('%b %d at %I:%M %p')}.",
            reference_type="appointment",
            reference_id=apt.id,
            link_tab="Support"
        )
        db.add(notif)

    # Audit
    audit = AuditLog(
        actor_user_id=counselor_user_id,
        actor_role="counselor",
        action="COUNSELOR_ACCEPTED_APPOINTMENT",
        resource_type="appointment",
        resource_id=apt.id
    )
    db.add(audit)

    db.commit()
    db.refresh(apt)
    return apt

def reschedule_appointment(db: Session, appointment_id: str, req: RescheduleRequest, actor_user_id: str, actor_role: str) -> Appointment:
    apt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not apt:
        raise NotFoundError("Appointment not found.")

    old_start = apt.scheduled_start
    apt.scheduled_start = req.new_start
    apt.scheduled_end = req.new_start + timedelta(minutes=apt.duration_minutes)
    apt.status = AppointmentStatus.RESCHEDULED

    target_user_id = apt.student.user_id if actor_role == "counselor" else apt.counselor.user_id
    notif = Notification(
        user_id=target_user_id,
        type=NotificationType.SESSION_SCHEDULED,
        title="Session Rescheduled",
        message=f"Session rescheduled to {req.new_start.strftime('%b %d, %Y at %I:%M %p')}. {req.message or ''}",
        reference_type="appointment",
        reference_id=apt.id
    )
    db.add(notif)

    db.commit()
    db.refresh(apt)
    return apt

def cancel_appointment(db: Session, appointment_id: str, reason: str, actor_user_id: str, actor_role: str) -> Appointment:
    apt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not apt:
        raise NotFoundError("Appointment not found.")

    apt.status = AppointmentStatus.CANCELLED
    target_user_id = apt.student.user_id if actor_role == "counselor" else apt.counselor.user_id

    notif = Notification(
        user_id=target_user_id,
        type=NotificationType.SYSTEM,
        title="Session Cancelled",
        message=f"Session scheduled for {apt.scheduled_start.strftime('%b %d')} was cancelled. Reason: {reason}",
        reference_type="appointment",
        reference_id=apt.id
    )
    db.add(notif)

    db.commit()
    db.refresh(apt)
    return apt
