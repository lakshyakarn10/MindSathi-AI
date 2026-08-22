from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.student import Student
from app.models.counselor import Counselor
from app.models.message import Conversation, Message
from app.models.notification import Notification, NotificationType
from app.schemas.analytics import MessageSendRequest, MessageRead, ConversationRead
from app.core.exceptions import NotFoundError, PermissionDeniedError

router = APIRouter(prefix="/messages", tags=["Confidential Messages"])

@router.get("", summary="Get User's Confidential Conversations")
def get_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role.value == "student":
        student = current_user.student_profile
        convs = db.query(Conversation).filter(Conversation.student_id == student.id).all() if student else []
    elif current_user.role.value == "counselor":
        counselor = current_user.counselor_profile
        convs = db.query(Conversation).filter(Conversation.counselor_id == counselor.id).all() if counselor else []
    else:
        raise PermissionDeniedError("Admins cannot access confidential student messages.")

    results = []
    for c in convs:
        anon_id = c.student.anonymous_id if c.student else "STU-XXXX"
        counselor_name = f"Dr. {c.counselor.user.full_name}" if c.counselor and c.counselor.user else "Counselor"
        results.append({
            "id": c.id,
            "student_id": c.student_id,
            "student_anonymous_id": anon_id,
            "counselor_id": c.counselor_id,
            "counselor_name": counselor_name,
            "last_message": c.last_message,
            "updated_at": c.updated_at
        })

    return {"success": True, "data": results}

@router.get("/{conversation_id}", summary="Get Messages in Conversation")
def get_messages(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise NotFoundError("Conversation not found.")

    msgs = db.query(Message).filter(
        Message.conversation_id == conversation_id
    ).order_by(Message.created_at.asc()).all()

    return {
        "success": True,
        "data": [
            {
                "id": m.id,
                "conversation_id": m.conversation_id,
                "sender_id": m.sender_id,
                "sender_role": m.sender_role,
                "content": m.content,
                "is_read": m.is_read,
                "created_at": m.created_at
            }
            for m in msgs
        ]
    }

@router.post("", summary="Send Message")
def send_message(
    req: MessageSendRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conv_id = req.conversation_id

    # If conversation doesn't exist, create one
    if not conv_id:
        if current_user.role.value == "student":
            student = current_user.student_profile
            counselor = db.query(Counselor).first()
            conv = Conversation(student_id=student.id, counselor_id=counselor.id if counselor else None, last_message=req.content)
        else:
            counselor = current_user.counselor_profile
            student = db.query(Student).first()
            conv = Conversation(student_id=student.id if student else None, counselor_id=counselor.id, last_message=req.content)
        db.add(conv)
        db.flush()
        conv_id = conv.id
    else:
        conv = db.query(Conversation).filter(Conversation.id == conv_id).first()
        if conv:
            conv.last_message = req.content

    msg = Message(
        conversation_id=conv_id,
        sender_id=current_user.id,
        sender_role=current_user.role.value,
        content=req.content,
        is_read=False
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    return {
        "success": True,
        "message": "Message sent securely.",
        "data": {
            "id": msg.id,
            "conversation_id": conv_id,
            "sender_role": msg.sender_role,
            "content": msg.content,
            "created_at": msg.created_at
        }
    }
