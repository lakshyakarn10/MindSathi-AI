from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class SessionRecord(Base):
    __tablename__ = "session_records"

    appointment_id = Column(String(36), ForeignKey("appointments.id", ondelete="CASCADE"), unique=True, nullable=False)
    discussion_topics = Column(Text, nullable=False)
    summary = Column(Text, nullable=False)
    recommendations = Column(Text, nullable=False)
    follow_up_required = Column(Boolean, default=False, nullable=False)
    next_follow_up_date = Column(DateTime, nullable=True)

    # Relationships
    appointment = relationship("Appointment", back_populates="session_record")
