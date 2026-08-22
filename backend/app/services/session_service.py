from datetime import datetime
from sqlalchemy.orm import Session
from app.models.session import SessionRecord
from app.models.appointment import Appointment, AppointmentStatus
from app.models.risk import EscalationCase, EscalationStatus
from app.models.notification import Notification, NotificationType
from app.models.audit import AuditLog
from app.schemas.appointment import SessionNotesCreate
from app.core.exceptions import NotFoundError

def complete_session_and_add_notes(
    db: Session,
    appointment_id: str,
    notes: SessionNotesCreate,
    counselor_user_id: str
) -> SessionRecord:
    apt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not apt:
        raise NotFoundError("Appointment not found.")

    apt.status = AppointmentStatus.COMPLETED

    record = db.query(SessionRecord).filter(SessionRecord.appointment_id == appointment_id).first()
    if not record:
        record = SessionRecord(
            appointment_id=appointment_id,
            discussion_topics=notes.discussion_topics,
            summary=notes.summary,
            recommendations=notes.recommendations,
            follow_up_required=notes.follow_up_required,
            next_follow_up_date=notes.next_follow_up_date
        )
        db.add(record)
    else:
        record.discussion_topics = notes.discussion_topics
        record.summary = notes.summary
        record.recommendations = notes.recommendations
        record.follow_up_required = notes.follow_up_required
        record.next_follow_up_date = notes.next_follow_up_date

    # Transition active escalation case to Monitoring if applicable
    case = db.query(EscalationCase).filter(
        EscalationCase.student_id == apt.student_id,
        EscalationCase.status.in_([EscalationStatus.NEW, EscalationStatus.REVIEWING, EscalationStatus.CONTACTED, EscalationStatus.SESSION_SCHEDULED])
    ).first()
    if case:
        case.status = EscalationStatus.MONITORING

    # Student completion notification
    notif = Notification(
        user_id=apt.student.user_id,
        type=NotificationType.SESSION_COMPLETED,
        title="Counseling Session Completed",
        message="Your counseling session has concluded. Recommended strategies and follow-up guidance are ready.",
        reference_type="appointment",
        reference_id=apt.id,
        link_tab="Support"
    )
    db.add(notif)

    # Audit log
    audit = AuditLog(
        actor_user_id=counselor_user_id,
        actor_role="counselor",
        action="COUNSELOR_RECORDED_SESSION_NOTES",
        resource_type="session",
        resource_id=record.id
    )
    db.add(audit)

    db.commit()
    db.refresh(record)
    return record
