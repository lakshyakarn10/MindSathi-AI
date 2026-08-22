from enum import Enum
from sqlalchemy import Column, String, Integer, ForeignKey, Text, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.wellness import RiskLevel

class EscalationStatus(str, Enum):
    NEW = "new"
    REVIEWING = "reviewing"
    CONTACTED = "contacted"
    SESSION_SCHEDULED = "session_scheduled"
    MONITORING = "monitoring"
    RESOLVED = "resolved"

class EscalationCase(Base):
    __tablename__ = "escalation_cases"

    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), index=True, nullable=False)
    assigned_counselor_id = Column(String(36), ForeignKey("counselors.id", ondelete="SET NULL"), index=True, nullable=True)
    risk_level = Column(SQLEnum(RiskLevel), default=RiskLevel.HIGH, index=True, nullable=False)
    risk_score = Column(Integer, default=80, nullable=False) # 0-100
    trigger_reason = Column(String(255), nullable=False)
    status = Column(SQLEnum(EscalationStatus), default=EscalationStatus.NEW, index=True, nullable=False)
    factors_json = Column(JSON, nullable=True) # {"mood": 21, "stress": 17, "sleep": 12, "journal": 18, "checkin": 14, "crisis": 20}
    notes = Column(Text, nullable=True)

    # Relationships
    student = relationship("Student", back_populates="escalation_cases")
    assigned_counselor = relationship("Counselor", back_populates="assigned_cases")
