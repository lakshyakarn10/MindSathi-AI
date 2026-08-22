from sqlalchemy import Column, String, Integer, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Student(Base):
    __tablename__ = "students"

    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    anonymous_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. STU-2048
    institution_id = Column(String(36), ForeignKey("institutions.id"), nullable=True)
    department = Column(String(100), default="Computer Science & Engineering", nullable=False)
    year_of_study = Column(Integer, default=2, nullable=False)
    preferred_language = Column(String(20), default="en", nullable=False)
    timezone = Column(String(50), default="Asia/Kolkata", nullable=False)
    onboarding_completed = Column(Boolean, default=False, nullable=False)

    # Relationships
    user = relationship("User", back_populates="student_profile")
    institution = relationship("Institution", back_populates="students")
    checkins = relationship("WellnessCheckin", back_populates="student", cascade="all, delete-orphan")
    journal_entries = relationship("JournalEntry", back_populates="student", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="student", foreign_keys="Appointment.student_id")
    escalation_cases = relationship("EscalationCase", back_populates="student")
    consent_records = relationship("ConsentRecord", back_populates="student", cascade="all, delete-orphan")
    exercise_completions = relationship("ExerciseCompletion", back_populates="student", cascade="all, delete-orphan")
