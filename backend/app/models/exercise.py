from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from app.core.database import Base

class Exercise(Base):
    __tablename__ = "exercises"

    title = Column(String(100), unique=True, nullable=False)
    description = Column(String(255), nullable=False)
    category = Column(String(50), default="breathing", nullable=False) # breathing, grounding, cognitive, sleep
    duration_seconds = Column(Integer, default=120, nullable=False)
    instructions = Column(Text, nullable=False)
    recommended_for = Column(String(100), default="stress", nullable=False)
    active = Column(Boolean, default=True, nullable=False)

    # Relationships
    completions = relationship("ExerciseCompletion", back_populates="exercise", cascade="all, delete-orphan")

class ExerciseCompletion(Base):
    __tablename__ = "exercise_completions"

    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), index=True, nullable=False)
    exercise_id = Column(String(36), ForeignKey("exercises.id", ondelete="CASCADE"), index=True, nullable=False)
    before_stress = Column(Float, default=7.0, nullable=False)
    after_stress = Column(Float, default=4.5, nullable=False)
    duration_seconds = Column(Integer, default=120, nullable=False)

    # Relationships
    student = relationship("Student", back_populates="exercise_completions")
    exercise = relationship("Exercise", back_populates="completions")
