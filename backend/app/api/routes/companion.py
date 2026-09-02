from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_student
from app.models.user import User, UserRole
from app.schemas.analytics import CompanionChatRequest, CompanionChatResponse
from app.services.companion_service import (
    process_companion_chat,
    get_student_companion_history,
    get_student_companion_conversations
)
from app.core.exceptions import NotFoundError, PermissionDeniedError
from app.core.config import settings

router = APIRouter(prefix="/companion", tags=["AI Companion"])

def _get_or_create_student(db: Session, current_user: User):
    student = current_user.student_profile
    if not student:
        from app.models.student import Student
        student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        import uuid
        from app.models.student import Student
        anon_id = f"STU-{uuid.uuid4().hex[:6].upper()}"
        student = Student(
            user_id=current_user.id,
            anonymous_id=anon_id,
            department="Campus Student",
            year_of_study=1
        )
        db.add(student)
        db.commit()
        db.refresh(student)
    return student

@router.get("/status", summary="Check Gemini Companion Service Status")
def get_companion_status():
    """Returns whether Gemini API is active or in fallback mode without exposing secret keys."""
    is_connected = bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip())
    return {
        "success": True,
        "status": "online",
        "gemini_mode": "CONNECTED" if is_connected else "FALLBACK_MODE",
        "model": getattr(settings, "GEMINI_MODEL", "gemini-2.5-flash")
    }

@router.post("/chat", response_model=CompanionChatResponse, summary="Chat with MindSaathi AI Companion")
def chat_with_companion(
    req: CompanionChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    student = _get_or_create_student(db, current_user)
    res = process_companion_chat(
        db=db,
        student_id=student.id,
        message=req.message,
        conversation_id=req.conversation_id
    )
    return res

@router.get("/history", summary="Get Companion Conversation Messages")
def get_companion_history(
    conversation_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == UserRole.ADMIN:
        raise PermissionDeniedError("Admins cannot access student AI companion conversations.")

    student = _get_or_create_student(db, current_user)
    history = get_student_companion_history(db, student.id, conversation_id=conversation_id)
    return {"success": True, "data": history}

@router.get("/conversations", summary="Get Student's Companion Conversation Sessions")
def get_companion_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == UserRole.ADMIN:
        raise PermissionDeniedError("Admins cannot access student AI companion conversations.")

    student = _get_or_create_student(db, current_user)
    convs = get_student_companion_conversations(db, student.id)
    return {"success": True, "data": convs}
