from enum import Enum
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.core.database import Base


class AppointmentStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    RESCHEDULED = "rescheduled"
    CANCELLED = "cancelled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    NO_SHOW = "no_show"
    REJECTED = "rejected"          # Phase 1 addition


class SessionMode(str, Enum):
    CHAT = "chat"                  # Phase 1 addition
    VIDEO = "video"
    PHONE = "phone"
    IN_PERSON = "in_person"


class Appointment(Base):
    __tablename__ = "appointments"

    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), index=True, nullable=False)
    counselor_id = Column(String(36), ForeignKey("counselors.id", ondelete="CASCADE"), index=True, nullable=False)
    session_type = Column(String(50), default="counseling", nullable=False)  # initial, follow_up, crisis
    mode = Column(SQLEnum(SessionMode, values_callable=lambda x: [e.value for e in x]), default=SessionMode.VIDEO, nullable=False)
    reason = Column(String(255), default="academic_stress", nullable=False)
    scheduled_start = Column(DateTime, index=True, nullable=False)
    scheduled_end = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, default=45, nullable=False)

    # Default is now PENDING — counselor must explicitly accept to move to CONFIRMED.
    # (Previously CONFIRMED, changed in Phase 1 to enforce the request → accept workflow.)
    status = Column(SQLEnum(AppointmentStatus, values_callable=lambda x: [e.value for e in x]), default=AppointmentStatus.PENDING, index=True, nullable=False)

    student_notes = Column(Text, nullable=True)
    # counselor_notes is NEVER exposed to students or admins — only returned on counselor-guarded routes
    counselor_notes = Column(Text, nullable=True)

    # --- Phase 1 new columns ---
    # VIDEO mode: counselor pastes Google Meet URL after confirming the session
    meet_url = Column(String(512), nullable=True)
    # IN_PERSON mode: counselor provides office / room / campus location after confirming
    location = Column(String(255), nullable=True)
    # Populated by counselor when status transitions to REJECTED
    rejection_reason = Column(String(255), nullable=True)

    # Relationships
    student = relationship("Student", back_populates="appointments", foreign_keys=[student_id])
    counselor = relationship("Counselor", back_populates="appointments", foreign_keys=[counselor_id])
    session_record = relationship("SessionRecord", back_populates="appointment", uselist=False, cascade="all, delete-orphan")
