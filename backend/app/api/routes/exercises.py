from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_student
from app.models.user import User
from app.models.exercise import Exercise, ExerciseCompletion
from app.schemas.analytics import ExerciseRead, ExerciseCompleteRequest, ExerciseCompletionRead
from app.core.exceptions import NotFoundError

router = APIRouter(prefix="/exercises", tags=["Guided Exercises"])

@router.get("", response_model=List[ExerciseRead], summary="Get All Guided Exercises")
def get_exercises(db: Session = Depends(get_db)):
    return db.query(Exercise).filter(Exercise.active == True).all()

@router.get("/{exercise_id}", response_model=ExerciseRead, summary="Get Exercise by ID")
def get_exercise_by_id(exercise_id: str, db: Session = Depends(get_db)):
    ex = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if not ex:
        raise NotFoundError("Exercise not found.")
    return ex

@router.post("/{exercise_id}/complete", summary="Record Exercise Completion & Stress Delta")
def complete_exercise(
    exercise_id: str,
    req: ExerciseCompleteRequest,
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    student = current_user.student_profile
    if not student:
        raise NotFoundError("Student profile not found.")

    ex = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if not ex:
        raise NotFoundError("Exercise not found.")

    comp = ExerciseCompletion(
        student_id=student.id,
        exercise_id=exercise_id,
        before_stress=req.before_stress,
        after_stress=req.after_stress,
        duration_seconds=req.duration_seconds
    )
    db.add(comp)
    db.commit()
    db.refresh(comp)

    delta = round(req.before_stress - req.after_stress, 1)

    return {
        "success": True,
        "message": f"Well done! Reported stress reduced by {delta} points.",
        "data": {
            "exercise": ex.title,
            "before_stress": req.before_stress,
            "after_stress": req.after_stress,
            "delta": delta
        }
    }
