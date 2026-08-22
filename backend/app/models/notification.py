from enum import Enum
from sqlalchemy import Column, String, Boolean, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.core.database import Base

class NotificationType(str, Enum):
    SESSION_SCHEDULED = "SESSION_SCHEDULED"
    SESSION_REMINDER = "SESSION_REMINDER"
    SESSION_COMPLETED = "SESSION_COMPLETED"
    CHECKIN_COMPLETED = "CHECKIN_COMPLETED"
    WELLNESS_INSIGHT = "WELLNESS_INSIGHT"
    EXERCISE_RECOMMENDATION = "EXERCISE_RECOMMENDATION"
    COUNSELOR_MESSAGE = "COUNSELOR_MESSAGE"
    ESCALATION_UPDATE = "ESCALATION_UPDATE"
    COUNSELOR_VERIFICATION = "COUNSELOR_VERIFICATION"
    SYSTEM = "SYSTEM"

class Notification(Base):
    __tablename__ = "notifications"

    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    type = Column(SQLEnum(NotificationType), default=NotificationType.SYSTEM, nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    reference_type = Column(String(50), nullable=True) # appointment, case, checkin
    reference_id = Column(String(36), nullable=True)
    link_tab = Column(String(50), nullable=True)
    is_read = Column(Boolean, default=False, index=True, nullable=False)

    # Relationships
    user = relationship("User", back_populates="notifications")
