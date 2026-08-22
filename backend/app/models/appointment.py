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

class SessionMode(str, Enum):
    VIDEO = "video"
    PHONE = "phone"
    IN_PERSON = "in_person"

class Appointment(Base):
    __tablename__ = "appointments"

    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), index=True, nullable=False)
    counselor_id = Column(String(36), ForeignKey("counselors.id", ondelete="CASCADE"), index=True, nullable=False)
    session_type = Column(String(50), default="counseling", nullable=False) # initial, follow_up, crisis
    mode = Column(SQLEnum(SessionMode), default=SessionMode.VIDEO, nullable=False)
    reason = Column(String(255), default="academic_stress", nullable=False)
    scheduled_start = Column(DateTime, index=True, nullable=False)
    scheduled_end = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, default=45, nullable=False)
    status = Column(SQLEnum(AppointmentStatus), default=AppointmentStatus.CONFIRMED, index=True, nullable=False)
    student_notes = Column(Text, nullable=True)
    counselor_notes = Column(Text, nullable=True)

    # Relationships
    student = relationship("Student", back_populates="appointments", foreign_keys=[student_id])
    counselor = relationship("Counselor", back_populates="appointments", foreign_keys=[counselor_id])
    session_record = relationship("SessionRecord", back_populates="appointment", uselist=False, cascade="all, delete-orphan")
