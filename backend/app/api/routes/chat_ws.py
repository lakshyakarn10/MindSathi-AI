from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status
from sqlalchemy.orm import Session
import json
import logging

from app.core.database import SessionLocal, get_db
from app.core.security import decode_token
from app.models.user import User, UserRole
from app.models.student import Student
from app.models.counselor import Counselor, VerificationStatus
from app.models.message import Conversation, Message
from app.models.appointment import Appointment, AppointmentStatus, SessionMode
from app.models.notification import Notification, NotificationType
from app.services.chat_ws_manager import chat_ws_manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ws", tags=["Real-time Chat WebSocket"])

def _get_ws_db() -> Session:
    """Returns database session supporting testing overrides."""
    from app.main import app
    if get_db in app.dependency_overrides:
        override_fn = app.dependency_overrides[get_db]
        gen = override_fn()
        return next(gen)
    return SessionLocal()

def _authenticate_ws_user(token: Optional[str], db: Session) -> User:
    """Validates token from query parameters and returns authenticated active user."""
    if not token:
        raise ValueError("TOKEN_REQUIRED")
    try:
        payload = decode_token(token, expected_type="access")
        user_id = payload.get("sub")
        if not user_id:
            raise ValueError("INVALID_TOKEN")
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.is_active:
            raise ValueError("USER_INACTIVE")
        return user
    except Exception as e:
        logger.warning(f"WebSocket auth failure: {e}")
        raise ValueError("AUTH_FAILED")

@router.websocket("/chat/{conversation_id}")
async def chat_websocket_endpoint(
    websocket: WebSocket,
    conversation_id: str,
    token: Optional[str] = Query(None)
):
    db: Session = _get_ws_db()
    user_id: Optional[str] = None
    user_role: Optional[str] = None
    user_full_name: Optional[str] = None

    try:
        # 1. Authenticate user
        try:
            user = _authenticate_ws_user(token, db)
            user_id = user.id
            user_role = user.role.value
            user_full_name = user.full_name
        except ValueError:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        # 2. Strict Role Checks (Admins cannot access confidential chat rooms)
        if user_role == "admin":
            logger.warning(f"Admin {user_id} attempted to access confidential chat {conversation_id}")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        # 3. Retrieve and Validate Conversation
        conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if not conversation:
            logger.warning(f"Conversation {conversation_id} not found")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        # 4. Check Conversation Participation
        if user_role == "student":
            student = user.student_profile
            if not student or conversation.student_id != student.id:
                logger.warning(f"Student {user_id} not authorized for conversation {conversation_id}")
                await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
                return
        elif user_role == "counselor":
            counselor = user.counselor_profile
            if not counselor or counselor.verification_status != VerificationStatus.APPROVED or conversation.counselor_id != counselor.id:
                logger.warning(f"Counselor {user_id} not authorized for conversation {conversation_id}")
                await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
                return
        else:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        # 5. Check Appointment Requirement (Confirmed CHAT appointment)
        appointment = db.query(Appointment).filter(
            Appointment.student_id == conversation.student_id,
            Appointment.counselor_id == conversation.counselor_id,
            Appointment.mode == SessionMode.CHAT
        ).order_by(Appointment.created_at.desc()).first()

        # If a CHAT appointment exists, enforce that it must be confirmed (or in progress/completed)
        if appointment:
            if appointment.status in [AppointmentStatus.PENDING, AppointmentStatus.REJECTED, AppointmentStatus.CANCELLED]:
                logger.info(f"Chat rejected: Appointment {appointment.id} is {appointment.status.value}")
                await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
                return

        # 6. Accept Connection
        await chat_ws_manager.connect(conversation_id, user_id, websocket)

        # Notify participants that user is online in the room
        await chat_ws_manager.broadcast_to_conversation(
            conversation_id,
            {
                "type": "user_status",
                "user_id": user_id,
                "sender_role": user_role,
                "status": "online"
            }
        )

        # 7. Listen for messages
        while True:
            raw_text = await websocket.receive_text()
            try:
                data = json.loads(raw_text)
            except Exception:
                await chat_ws_manager.send_personal_message(
                    websocket,
                    {"type": "error", "code": "INVALID_JSON", "message": "Malformed JSON payload."}
                )
                continue

            event_type = data.get("type", "message")

            if event_type == "message":
                content = str(data.get("content", "")).strip()
                client_msg_id = data.get("client_msg_id")

                # Validation
                if not content:
                    await chat_ws_manager.send_personal_message(
                        websocket,
                        {"type": "error", "code": "INVALID_MESSAGE", "message": "Message cannot be empty."}
                    )
                    continue

                if len(content) > 2000:
                    await chat_ws_manager.send_personal_message(
                        websocket,
                        {"type": "error", "code": "INVALID_MESSAGE", "message": "Message exceeds maximum length of 2000 characters."}
                    )
                    continue

                # Check if appointment is completed (read-only)
                if appointment and appointment.status == AppointmentStatus.COMPLETED:
                    await chat_ws_manager.send_personal_message(
                        websocket,
                        {"type": "error", "code": "SESSION_COMPLETED", "message": "This counseling session has concluded."}
                    )
                    continue

                # Persist to PostgreSQL before broadcasting
                msg = Message(
                    conversation_id=conversation_id,
                    sender_id=user_id,
                    sender_role=user_role,
                    content=content,
                    is_read=False
                )
                db.add(msg)
                conversation.last_message = content
                db.commit()
                db.refresh(msg)

                # Broadcast persisted message to all connected clients in the conversation
                message_payload = {
                    "type": "message",
                    "message": {
                        "id": msg.id,
                        "client_msg_id": client_msg_id,
                        "conversation_id": conversation_id,
                        "sender_id": user_id,
                        "sender_role": user_role,
                        "content": msg.content,
                        "created_at": msg.created_at.isoformat() if msg.created_at else None,
                        "is_read": False
                    }
                }
                await chat_ws_manager.broadcast_to_conversation(conversation_id, message_payload)

                # Check if recipient is in the room; if not, trigger notification
                recipient_user_id = None
                if user_role == "student":
                    counselor = db.query(Counselor).filter(Counselor.id == conversation.counselor_id).first()
                    if counselor:
                        recipient_user_id = counselor.user_id
                elif user_role == "counselor":
                    student = db.query(Student).filter(Student.id == conversation.student_id).first()
                    if student:
                        recipient_user_id = student.user_id

                if recipient_user_id and not chat_ws_manager.is_user_in_conversation(conversation_id, recipient_user_id):
                    short_preview = (content[:50] + "...") if len(content) > 50 else content
                    sender_label = f"Dr. {user_full_name}" if user_role == "counselor" else "Student"
                    notif = Notification(
                        user_id=recipient_user_id,
                        type=NotificationType.COUNSELOR_MESSAGE,
                        title=f"New Message from {sender_label}",
                        message=f"New counseling message: \"{short_preview}\"",
                        reference_type="conversation",
                        reference_id=conversation_id,
                        link_tab="Messages"
                    )
                    db.add(notif)
                    db.commit()

            elif event_type == "typing":
                is_typing = bool(data.get("is_typing", True))
                await chat_ws_manager.broadcast_to_conversation(
                    conversation_id,
                    {
                        "type": "typing",
                        "sender_role": user_role,
                        "user_id": user_id,
                        "is_typing": is_typing
                    },
                    exclude_ws=websocket
                )

            elif event_type == "read":
                # Mark messages as read in DB
                db.query(Message).filter(
                    Message.conversation_id == conversation_id,
                    Message.sender_id != user_id,
                    Message.is_read == False
                ).update({"is_read": True})
                db.commit()

                await chat_ws_manager.broadcast_to_conversation(
                    conversation_id,
                    {
                        "type": "read",
                        "reader_role": user_role,
                        "reader_id": user_id
                    },
                    exclude_ws=websocket
                )

    except WebSocketDisconnect:
        logger.info(f"WebSocket client disconnected cleanly: user={user_id or 'unknown'}, conv={conversation_id}")
    except Exception as e:
        logger.error(f"WebSocket unhandled error: {e}")
    finally:
        if user_id:
            chat_ws_manager.disconnect(conversation_id, websocket)
            await chat_ws_manager.broadcast_to_conversation(
                conversation_id,
                {
                    "type": "user_status",
                    "user_id": user_id,
                    "sender_role": user_role,
                    "status": "offline"
                }
            )
        db.close()
        db.close()
