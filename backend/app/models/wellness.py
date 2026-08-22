from enum import Enum
from sqlalchemy import Column, String, Integer, Float, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.core.database import Base

class RiskLevel(str, Enum):
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    CRITICAL = "critical"

class WellnessCheckin(Base):
    __tablename__ = "wellness_checkins"

    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), index=True, nullable=False)
    mood_score = Column(Integer, default=7, nullable=False) # 0-10
    stress_score = Column(Integer, default=5, nullable=False) # 0-10
    energy_score = Column(Integer, default=6, nullable=False) # 0-10
    sleep_hours = Column(Float, default=7.0, nullable=False)
    sleep_quality = Column(Integer, default=7, nullable=False) # 0-10
    academic_stress = Column(Integer, default=5, nullable=False) # 0-10
    social_connection = Column(Integer, default=6, nullable=False) # 0-10

    journal_text = Column(Text, nullable=True) # transient or brief reflection note
    sentiment_score = Column(Float, default=0.0, nullable=False) # -1.0 to 1.0
    emotion_label = Column(String(50), default="calm", nullable=False)
    wellness_score = Column(Float, default=74.0, nullable=False) # 0-100
    risk_level = Column(SQLEnum(RiskLevel), default=RiskLevel.LOW, index=True, nullable=False)

    # Relationships
    student = relationship("Student", back_populates="checkins")
