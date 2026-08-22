from enum import Enum
from sqlalchemy import Column, String, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.core.database import Base

class VerificationStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class AvailabilityStatus(str, Enum):
    AVAILABLE = "available"
    BUSY = "busy"
    OFFLINE = "offline"

class Counselor(Base):
    __tablename__ = "counselors"

    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    institution_id = Column(String(36), ForeignKey("institutions.id"), nullable=True)
    professional_role = Column(String(100), default="Campus Counselor", nullable=False)
    employee_id = Column(String(50), nullable=False)
    department = Column(String(100), default="Student Wellness Center", nullable=False)
    verification_status = Column(SQLEnum(VerificationStatus), default=VerificationStatus.PENDING, nullable=False)
    availability_status = Column(SQLEnum(AvailabilityStatus), default=AvailabilityStatus.AVAILABLE, nullable=False)

    # Relationships
    user = relationship("User", back_populates="counselor_profile")
    institution = relationship("Institution", back_populates="counselors")
    appointments = relationship("Appointment", back_populates="counselor", foreign_keys="Appointment.counselor_id")
    assigned_cases = relationship("EscalationCase", back_populates="assigned_counselor")
