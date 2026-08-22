from sqlalchemy import Column, String, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class JournalEntry(Base):
    __tablename__ = "journal_entries"

    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), index=True, nullable=False)
    encrypted_content = Column(Text, nullable=False) # AES encrypted at rest
    mood = Column(String(50), default="Neutral", nullable=True)

    # Relationships
    student = relationship("Student", back_populates="journal_entries")
