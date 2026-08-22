from sqlalchemy import Column, String, Integer
from sqlalchemy.orm import relationship
from app.core.database import Base

class Institution(Base):
    __tablename__ = "institutions"

    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, index=True, nullable=False)
    country = Column(String(100), default="India", nullable=False)
    timezone = Column(String(50), default="Asia/Kolkata", nullable=False)
    privacy_threshold = Column(Integer, default=15, nullable=False)

    # Relationships
    students = relationship("Student", back_populates="institution")
    counselors = relationship("Counselor", back_populates="institution")
    admins = relationship("Admin", back_populates="institution")
