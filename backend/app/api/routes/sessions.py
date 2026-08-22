from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import require_counselor
from app.models.user import User
from app.schemas.appointment import SessionNotesCreate
from app.services.session_service import complete_session_and_add_notes

router = APIRouter(prefix="/sessions", tags=["Session Documentation"])

@router.post("/{appointment_id}/notes", summary="Add Session Notes & Summary (Confidential Counselor Data)")
def record_notes(
    appointment_id: str,
    notes: SessionNotesCreate,
    current_user: User = Depends(require_counselor),
    db: Session = Depends(get_db)
):
    record = complete_session_and_add_notes(db, appointment_id, notes, counselor_user_id=current_user.id)
    return {
        "success": True,
        "message": "Session notes recorded securely.",
        "data": {
            "id": record.id,
            "appointment_id": record.appointment_id,
            "created_at": record.created_at
        }
    }
