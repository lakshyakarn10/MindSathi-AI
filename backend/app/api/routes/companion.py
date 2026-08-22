from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.analytics import CompanionChatRequest, CompanionChatResponse
from app.services.companion_service import generate_companion_reply

router = APIRouter(prefix="/companion", tags=["AI Companion"])

@router.post("/chat", response_model=CompanionChatResponse, summary="Chat with MindSaathi AI Companion")
def chat_with_companion(
    req: CompanionChatRequest,
    current_user: User = Depends(get_current_user)
):
    return generate_companion_reply(req.message)
