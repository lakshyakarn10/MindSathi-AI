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

@router.get("/appointment/{appointment_id}/conversation", summary="Get or create conversation for an appointment")
def get_appointment_conversation(
    appointment_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from app.models.appointment import Appointment, AppointmentStatus
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise NotFoundError("Appointment not found.")

    # Authorization
    if current_user.role.value == "student":
        student = current_user.student_profile
        if not student or appointment.student_id != student.id:
            raise PermissionDeniedError("You are not authorized for this appointment.")
    elif current_user.role.value == "counselor":
        counselor = current_user.counselor_profile
        if not counselor or appointment.counselor_id != counselor.id:
            raise PermissionDeniedError("You are not authorized for this appointment.")
    else:
        raise PermissionDeniedError("Admins cannot access confidential counseling chats.")

    # Find existing conversation between these two
    conv = db.query(Conversation).filter(
        Conversation.student_id == appointment.student_id,
        Conversation.counselor_id == appointment.counselor_id
    ).first()

    if not conv:
        conv = Conversation(
            student_id=appointment.student_id,
            counselor_id=appointment.counselor_id,
            last_message=None
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)

    return {
        "success": True,
        "data": {
            "conversation_id": conv.id,
            "appointment_id": appointment.id,
            "appointment_status": appointment.status.value,
            "appointment_mode": appointment.mode.value,
            "is_chat_enabled": appointment.status == AppointmentStatus.CONFIRMED or appointment.status == AppointmentStatus.IN_PROGRESS
        }
    }

@router.get("/{conversation_id}", summary="Get Messages in Conversation")
def get_messages(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise NotFoundError("Conversation not found.")

    # Access Control
    if current_user.role.value == "student":
        student = current_user.student_profile
        if not student or conv.student_id != student.id:
            raise PermissionDeniedError("You are not authorized to view this conversation.")
    elif current_user.role.value == "counselor":
        counselor = current_user.counselor_profile
        if not counselor or conv.counselor_id != counselor.id:
            raise PermissionDeniedError("You are not authorized to view this conversation.")
    else:
        raise PermissionDeniedError("Admins cannot view confidential messages.")

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

@router.patch("/{conversation_id}/read", summary="Mark Conversation Messages as Read")
def mark_messages_read(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise NotFoundError("Conversation not found.")

    if current_user.role.value == "student":
        student = current_user.student_profile
        if not student or conv.student_id != student.id:
            raise PermissionDeniedError("Unauthorized.")
    elif current_user.role.value == "counselor":
        counselor = current_user.counselor_profile
        if not counselor or conv.counselor_id != counselor.id:
            raise PermissionDeniedError("Unauthorized.")
    else:
        raise PermissionDeniedError("Unauthorized.")

    db.query(Message).filter(
        Message.conversation_id == conversation_id,
        Message.sender_id != current_user.id,
        Message.is_read == False
    ).update({"is_read": True})
    db.commit()

    return {"success": True, "message": "Messages marked as read."}

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
            # Find a counselor from the same institution
            counselor = None
            if student and student.institution_id:
                from app.models.counselor import VerificationStatus as VS
                counselor = db.query(Counselor).filter(
                    Counselor.institution_id == student.institution_id,
                    Counselor.verification_status == VS.APPROVED
                ).first()
            if not counselor:
                from app.models.counselor import VerificationStatus as VS2
                counselor = db.query(Counselor).filter(Counselor.verification_status == VS2.APPROVED).first()
            conv = Conversation(student_id=student.id if student else None, counselor_id=counselor.id if counselor else None, last_message=req.content)
        else:
            counselor = current_user.counselor_profile
            # Find receiver_id student if provided, else pick first student in same institution
            receiver_student = None
            if req.receiver_id:
                receiver_student = db.query(Student).filter(Student.id == req.receiver_id).first()
            if not receiver_student and counselor and counselor.institution_id:
                receiver_student = db.query(Student).filter(
                    Student.institution_id == counselor.institution_id
                ).first()
            if not receiver_student:
                receiver_student = db.query(Student).first()
            conv = Conversation(student_id=receiver_student.id if receiver_student else None, counselor_id=counselor.id, last_message=req.content)
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

    # Trigger notification for the recipient
    short_preview = (req.content[:60] + "...") if len(req.content) > 60 else req.content
    if current_user.role.value == "student":
        # Recipient is counselor
        counselor = db.query(Counselor).filter(Counselor.id == conv.counselor_id).first() if conv.counselor_id else None
        if counselor and counselor.user_id:
            student = current_user.student_profile
            anon_id = student.anonymous_id if student else "Student"
            notif = Notification(
                user_id=counselor.user_id,
                type=NotificationType.COUNSELOR_MESSAGE,
                title=f"New Message from {anon_id}",
                message=f"Confidential message received: \"{short_preview}\"",
                reference_type="conversation",
                reference_id=conv_id,
                link_tab="Messages"
            )
            db.add(notif)
    elif current_user.role.value == "counselor":
        # Recipient is student
        student = db.query(Student).filter(Student.id == conv.student_id).first() if conv.student_id else None
        if student and student.user_id:
            counselor_name = current_user.full_name or "Counselor"
            notif = Notification(
                user_id=student.user_id,
                type=NotificationType.COUNSELOR_MESSAGE,
                title=f"New Message from Dr. {counselor_name}",
                message=f"Your counselor sent you a message: \"{short_preview}\"",
                reference_type="conversation",
                reference_id=conv_id,
                link_tab="Messages"
            )
            db.add(notif)

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
