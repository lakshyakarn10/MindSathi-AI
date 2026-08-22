from enum import Enum
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.core.database import Base

class ConsentType(str, Enum):
    WELLNESS_DATA = "WELLNESS_DATA"
    AI_ANALYSIS = "AI_ANALYSIS"
    COUNSELOR_ACCESS = "COUNSELOR_ACCESS"
    JOURNAL_SHARING = "JOURNAL_SHARING"
    WEARABLE_DATA = "WEARABLE_DATA"
    INSTITUTIONAL_ANALYTICS = "INSTITUTIONAL_ANALYTICS"

class ConsentRecord(Base):
    __tablename__ = "consent_records"

    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), index=True, nullable=False)
    consent_type = Column(SQLEnum(ConsentType), nullable=False)
    granted = Column(Boolean, default=True, nullable=False)
    version = Column(String(20), default="1.0", nullable=False)
    granted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    revoked_at = Column(DateTime, nullable=True)

    # Relationships
    student = relationship("Student", back_populates="consent_records")
