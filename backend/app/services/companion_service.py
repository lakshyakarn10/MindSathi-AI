"""
Companion Service — Phase 3:
- Multi-turn conversation persistence in CompanionConversation & CompanionMessage
- Gemini LLM integration with empathetic system prompts and fallback heuristic
- Structured wellness observations extraction from chat
- Integration with Multivariate Risk Engine and Counselor Escalation Pipeline
"""
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.companion import CompanionConversation, CompanionMessage, MessageRole
from app.models.student import Student
from app.models.wellness import WellnessCheckin, RiskLevel
from app.schemas.analytics import CompanionChatResponse
from app.core.gemini_client import (
    generate_gemini_companion_response,
    extract_structured_wellness_observations
)
from app.ml.risk_engine import calculate_risk
from app.services.risk_service import evaluate_and_escalate
from app.core.exceptions import NotFoundError, PermissionDeniedError


def process_companion_chat(
    db: Session,
    student_id: str,
    message: str,
    conversation_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Handles a full conversational turn for a student:
    1. Fetches or creates CompanionConversation
    2. Saves incoming student message
    3. Loads history and calls Gemini LLM
    4. Saves assistant reply
    5. Extracts structured wellness observations
    6. Triggers risk assessment & potential escalation if crisis/severe distress flagged
    7. Returns response with conversation metadata
    """
    # 1. Retrieve or initialize conversation
    conv = None
    if conversation_id:
        conv = db.query(CompanionConversation).filter(
            CompanionConversation.id == conversation_id,
            CompanionConversation.student_id == student_id
        ).first()
        if not conv:
            raise NotFoundError("Companion conversation not found or unauthorized.")
    else:
        # No conversation_id supplied — always start a fresh conversation.
        # The caller is responsible for sending back the returned conversation_id
        # on subsequent messages to maintain context within a session.
        conv = CompanionConversation(student_id=student_id)
        db.add(conv)
        db.flush()

    # 2. Append student message
    student_msg = CompanionMessage(
        conversation_id=conv.id,
        role=MessageRole.STUDENT,
        content=message
    )
    db.add(student_msg)
    db.flush()

    # 3. Retrieve recent history for context (latest 20 messages, reversed to chronological).
    #    Exclude heuristic fallback messages (is_fallback flag on content metadata not stored,
    #    so we rely on is_fallback field if stored, otherwise include all recent messages).
    history_records = db.query(CompanionMessage).filter(
        CompanionMessage.conversation_id == conv.id
    ).order_by(CompanionMessage.created_at.desc()).limit(20).all()
    history_records.reverse()  # Back to chronological order for the LLM

    chat_history = [
        {"role": m.role.value if hasattr(m.role, "value") else str(m.role), "content": m.content}
        for m in history_records
    ]

    # 4. Generate AI reply (Gemini with fallback)
    try:
        ai_result = generate_gemini_companion_response(chat_history)
    except Exception:
        from app.core.gemini_client import _generate_heuristic_companion_reply
        ai_result = _generate_heuristic_companion_reply(message)
    ai_reply_text = ai_result["response"]

    # 5. Append assistant reply
    assistant_msg = CompanionMessage(
        conversation_id=conv.id,
        role=MessageRole.ASSISTANT,
        content=ai_reply_text
    )
    db.add(assistant_msg)
    conv.updated_at = datetime.now(timezone.utc)
    db.flush()

    # 6. Extract structured wellness observations
    observations = extract_structured_wellness_observations(chat_history)

    # 7. Evaluate potential counselor escalation if crisis or high distress is flagged
    if observations.get("crisis_flag") or observations.get("conversational_risk_factor", 0) >= 60.0:
        latest_checkin = db.query(WellnessCheckin).filter(
            WellnessCheckin.student_id == student_id
        ).order_by(WellnessCheckin.created_at.desc()).first()

        risk_info = calculate_risk(
            mood_score=latest_checkin.mood_score if latest_checkin else 4,
            stress_score=latest_checkin.stress_score if latest_checkin else 8,
            sleep_hours=latest_checkin.sleep_hours if latest_checkin else 5.0,
            sentiment_score=observations.get("sentiment_score", -0.5),
            recent_checkins_count=1,
            crisis_flag=observations.get("crisis_flag", False),
            conversation_signals=observations
        )

        crisis_data = {"crisis_indicator": observations.get("crisis_flag", False)}
        if latest_checkin:
            evaluate_and_escalate(db, student_id, latest_checkin, risk_info, crisis_data)
        else:
            # Create a mock minimal checkin reference for escalation record
            temp_checkin = WellnessCheckin(
                student_id=student_id,
                mood_score=3,
                stress_score=8,
                wellness_score=35.0,
                risk_indicator=risk_info["risk_indicator"],
                risk_level=risk_info["risk_level"]
            )
            db.add(temp_checkin)
            db.flush()
            evaluate_and_escalate(db, student_id, temp_checkin, risk_info, crisis_data)

    db.commit()
    db.refresh(conv)

    return {
        "conversation_id": conv.id,
        "response": ai_reply_text,
        "suggested_topics": ai_result.get("suggested_topics", []),
        "recommended_exercise": ai_result.get("recommended_exercise"),
        "should_offer_counselor": ai_result.get("should_offer_counselor", False) or observations.get("crisis_flag", False),
        "crisis_detected": ai_result.get("crisis_detected", False) or observations.get("crisis_flag", False),
        "observations": observations,
        "model_used": ai_result.get("model_used", "gemini-1.5-flash"),
        "is_fallback": ai_result.get("is_fallback", False)
    }


def get_student_companion_history(
    db: Session,
    student_id: str,
    conversation_id: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Retrieves message history for a student's companion conversation.
    Strictly isolated to the owning student.
    """
    if conversation_id:
        conv = db.query(CompanionConversation).filter(
            CompanionConversation.id == conversation_id,
            CompanionConversation.student_id == student_id
        ).first()
    else:
        conv = db.query(CompanionConversation).filter(
            CompanionConversation.student_id == student_id
        ).order_by(CompanionConversation.created_at.desc()).first()

    if not conv:
        return []

    messages = db.query(CompanionMessage).filter(
        CompanionMessage.conversation_id == conv.id
    ).order_by(CompanionMessage.created_at.asc()).all()

    return [
        {
            "id": m.id,
            "conversation_id": m.conversation_id,
            "role": m.role.value if hasattr(m.role, "value") else str(m.role),
            "content": m.content,
            "created_at": m.created_at
        }
        for m in messages
    ]


def get_student_companion_conversations(db: Session, student_id: str) -> List[Dict[str, Any]]:
    """
    Lists all companion conversation sessions for a student.
    """
    convs = db.query(CompanionConversation).filter(
        CompanionConversation.student_id == student_id
    ).order_by(CompanionConversation.updated_at.desc()).all()

    results = []
    for c in convs:
        last_msg = db.query(CompanionMessage).filter(
            CompanionMessage.conversation_id == c.id
        ).order_by(CompanionMessage.created_at.desc()).first()
        results.append({
            "id": c.id,
            "created_at": c.created_at,
            "updated_at": c.updated_at,
            "message_count": len(c.messages),
            "last_message": last_msg.content[:80] if last_msg else ""
        })
    return results
