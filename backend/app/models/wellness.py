from enum import Enum
from sqlalchemy import Column, String, Integer, Float, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship, validates
from app.core.database import Base


class RiskLevel(str, Enum):
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    CRITICAL = "critical"


class WellnessCheckin(Base):
    __tablename__ = "wellness_checkins"

    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), index=True, nullable=False)
    mood_score = Column(Integer, default=7, nullable=False)          # 0-10
    stress_score = Column(Integer, default=5, nullable=False)        # 0-10
    energy_score = Column(Integer, default=6, nullable=False)        # 0-10
    sleep_hours = Column(Float, default=7.0, nullable=False)
    sleep_quality = Column(Integer, default=7, nullable=False)       # 0-10
    academic_stress = Column(Integer, default=5, nullable=False)     # 0-10
    social_connection = Column(Integer, default=6, nullable=False)   # 0-10

    journal_text = Column(Text, nullable=True)                       # transient or brief reflection note
    sentiment_score = Column(Float, default=0.0, nullable=False)     # -1.0 to 1.0
    emotion_label = Column(String(50), default="calm", nullable=False)

    # Existing 0-100 composite wellness index — NOT changed
    wellness_score = Column(Float, default=74.0, nullable=False)     # 0-100

    # --- Phase 1 addition ---
    # Separate risk indicator on 1.0–10.0 scale (higher = greater concern).
    # Populated as max(1.0, min(10.0, risk_score / 10.0)) from the existing risk engine.
    # Phase 3 will wire in Gemini observations + longitudinal deltas.
    # Constraint: 1.0 <= risk_indicator <= 10.0 enforced in model validation and wellness_service.py
    risk_indicator = Column(Float, default=3.0, nullable=False)      # 1.0-10.0

    risk_level = Column(SQLEnum(RiskLevel), default=RiskLevel.LOW, index=True, nullable=False)

    @validates("risk_indicator")
    def validate_risk_indicator(self, key, value):
        if value is not None:
            if float(value) < 1.0 or float(value) > 10.0:
                raise ValueError("risk_indicator must be between 1.0 and 10.0")
        return float(value)

    # Relationships
    student = relationship("Student", back_populates="checkins")
