import pytest
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
import json

from app.main import app
from app.core.database import Base, engine, get_db
from app.core.security import create_access_token, get_password_hash
from app.models.user import User, UserRole
from app.models.student import Student
from app.models.counselor import Counselor, VerificationStatus
from app.models.admin import Admin, AuthorizationStatus
from app.models.institution import Institution
from app.models.appointment import Appointment, AppointmentStatus, SessionMode
from app.models.message import Conversation, Message
from app.models.notification import Notification


@pytest.fixture
def chat_fixture(db_session: Session):
    # Create Institution
    inst = Institution(name="Global Tech University", code=f"GTU_{datetime.now().timestamp()}")
    db_session.add(inst)
    db_session.flush()

    # Create Student A User
    stu_user = User(
        email=f"student_a_{datetime.now().timestamp()}@gtu.edu",
        password_hash=get_password_hash("Password123!"),
        full_name="Alex River",
        role=UserRole.STUDENT,
        is_active=True
    )
    db_session.add(stu_user)
    db_session.flush()

    stu_profile = Student(
        user_id=stu_user.id,
        institution_id=inst.id,
        anonymous_id=f"STU-A{int(datetime.now().timestamp() * 1000) % 100000}",
        verification_status=VerificationStatus.APPROVED
    )
    db_session.add(stu_profile)
    db_session.flush()

    # Create Student B User (for cross-student tests)
    stu_b_user = User(
        email=f"student_b_{datetime.now().timestamp()}@gtu.edu",
        password_hash=get_password_hash("Password123!"),
        full_name="Bob Mason",
        role=UserRole.STUDENT,
        is_active=True
    )
    db_session.add(stu_b_user)
    db_session.flush()

    stu_b_profile = Student(
        user_id=stu_b_user.id,
        institution_id=inst.id,
        anonymous_id=f"STU-B{int(datetime.now().timestamp() * 1000) % 100000 + 1}",
        verification_status=VerificationStatus.APPROVED
    )
    db_session.add(stu_b_profile)
    db_session.flush()

    # Create Counselor User
    coun_user = User(
        email=f"counselor_a_{datetime.now().timestamp()}@gtu.edu",
        password_hash=get_password_hash("Password123!"),
        full_name="Priya Sharma",
        role=UserRole.COUNSELOR,
        is_active=True
    )
    db_session.add(coun_user)
    db_session.flush()

    coun_profile = Counselor(
        user_id=coun_user.id,
        institution_id=inst.id,
        employee_id=f"EMP-{int(datetime.now().timestamp())}",
        department="Mental Health Cell",
        verification_status=VerificationStatus.APPROVED
    )
    db_session.add(coun_profile)
    db_session.flush()

    # Create Counselor B User (for cross-counselor tests)
    coun_b_user = User(
        email=f"counselor_b_{datetime.now().timestamp()}@gtu.edu",
        password_hash=get_password_hash("Password123!"),
        full_name="Rajesh Kumar",
        role=UserRole.COUNSELOR,
        is_active=True
    )
    db_session.add(coun_b_user)
    db_session.flush()

    coun_b_profile = Counselor(
        user_id=coun_b_user.id,
        institution_id=inst.id,
        employee_id=f"EMP-B-{int(datetime.now().timestamp())}",
        department="Career Counseling",
        verification_status=VerificationStatus.APPROVED
    )
    db_session.add(coun_b_profile)
    db_session.flush()

    # Create Admin User
    admin_user = User(
        email=f"admin_{datetime.now().timestamp()}@gtu.edu",
        password_hash=get_password_hash("Password123!"),
        full_name="Campus Administrator",
        role=UserRole.ADMIN,
        is_active=True
    )
    db_session.add(admin_user)
    db_session.flush()

    admin_profile = Admin(
        user_id=admin_user.id,
        institution_id=inst.id,
        authorization_status=AuthorizationStatus.AUTHORIZED
    )
    db_session.add(admin_profile)
    db_session.flush()

    # Create Conversation between Student A and Counselor A
    conv = Conversation(
        student_id=stu_profile.id,
        counselor_id=coun_profile.id,
        last_message=None
    )
    db_session.add(conv)
    db_session.flush()

    # Create Confirmed CHAT Appointment
    apt = Appointment(
        student_id=stu_profile.id,
        counselor_id=coun_profile.id,
        session_type="counseling",
        mode=SessionMode.CHAT,
        status=AppointmentStatus.CONFIRMED,
        reason="Exam anxiety",
        scheduled_start=datetime.now(timezone.utc),
        scheduled_end=datetime.now(timezone.utc) + timedelta(minutes=45),
        duration_minutes=45
    )
    db_session.add(apt)
    db_session.commit()

    # Generate JWT Tokens
    stu_token = create_access_token(stu_user.id, role=stu_user.role.value)
    stu_b_token = create_access_token(stu_b_user.id, role=stu_b_user.role.value)
    coun_token = create_access_token(coun_user.id, role=coun_user.role.value)
    coun_b_token = create_access_token(coun_b_user.id, role=coun_b_user.role.value)
    admin_token = create_access_token(admin_user.id, role=admin_user.role.value)

    return {
        "institution": inst,
        "student_user": stu_user,
        "student_profile": stu_profile,
        "student_b_user": stu_b_user,
        "counselor_user": coun_user,
        "counselor_profile": coun_profile,
        "counselor_b_user": coun_b_user,
        "admin_user": admin_user,
        "conversation": conv,
        "appointment": apt,
        "stu_token": stu_token,
        "stu_b_token": stu_b_token,
        "coun_token": coun_token,
        "coun_b_token": coun_b_token,
        "admin_token": admin_token,
    }


def test_unauthenticated_websocket_rejected(client, chat_fixture):
    conv_id = chat_fixture["conversation"].id
    with pytest.raises(Exception):
        with client.websocket_connect(f"/api/v1/ws/chat/{conv_id}"):
            pass


def test_invalid_token_websocket_rejected(client, chat_fixture):
    conv_id = chat_fixture["conversation"].id
    with pytest.raises(Exception):
        with client.websocket_connect(f"/api/v1/ws/chat/{conv_id}?token=invalid.jwt.token"):
            pass


def test_admin_cannot_access_confidential_chat(client, chat_fixture):
    conv_id = chat_fixture["conversation"].id
    admin_token = chat_fixture["admin_token"]
    with pytest.raises(Exception):
        with client.websocket_connect(f"/api/v1/ws/chat/{conv_id}?token={admin_token}"):
            pass


def test_cross_student_chat_access_rejected(client, chat_fixture):
    conv_id = chat_fixture["conversation"].id
    stu_b_token = chat_fixture["stu_b_token"]
    with pytest.raises(Exception):
        with client.websocket_connect(f"/api/v1/ws/chat/{conv_id}?token={stu_b_token}"):
            pass


def test_cross_counselor_chat_access_rejected(client, chat_fixture):
    conv_id = chat_fixture["conversation"].id
    coun_b_token = chat_fixture["coun_b_token"]
    with pytest.raises(Exception):
        with client.websocket_connect(f"/api/v1/ws/chat/{conv_id}?token={coun_b_token}"):
            pass


def test_unconfirmed_appointment_cannot_access_chat(client, chat_fixture, db_session: Session):
    # Change appointment status to PENDING
    apt = chat_fixture["appointment"]
    apt.status = AppointmentStatus.PENDING
    db_session.commit()

    conv_id = chat_fixture["conversation"].id
    stu_token = chat_fixture["stu_token"]

    with pytest.raises(Exception):
        with client.websocket_connect(f"/api/v1/ws/chat/{conv_id}?token={stu_token}"):
            pass


def test_realtime_bidirectional_chat_and_persistence(client, chat_fixture, db_session: Session):
    conv_id = chat_fixture["conversation"].id
    stu_token = chat_fixture["stu_token"]
    coun_token = chat_fixture["coun_token"]

    # Student connects
    with client.websocket_connect(f"/api/v1/ws/chat/{conv_id}?token={stu_token}") as stu_ws:
        # Counselor connects
        with client.websocket_connect(f"/api/v1/ws/chat/{conv_id}?token={coun_token}") as coun_ws:
            # Student sends a message
            stu_ws.send_json({
                "type": "message",
                "content": "Hello Dr. Priya, I need help with exam anxiety.",
                "client_msg_id": "client-uuid-1"
            })

            # Counselor receives the message
            coun_data = coun_ws.receive_json()
            if coun_data.get("type") == "user_status":
                coun_data = coun_ws.receive_json()

            assert coun_data["type"] == "message"
            assert coun_data["message"]["content"] == "Hello Dr. Priya, I need help with exam anxiety."
            assert coun_data["message"]["sender_role"] == "student"

            # Counselor replies
            coun_ws.send_json({
                "type": "message",
                "content": "Hello Alex. I'm here to support you. Let's talk about what feels heaviest right now.",
                "client_msg_id": "client-uuid-2"
            })

            # Student receives counselor's message
            stu_data = stu_ws.receive_json()
            while stu_data.get("type") == "user_status" or (stu_data.get("type") == "message" and stu_data["message"]["sender_role"] == "student"):
                stu_data = stu_ws.receive_json()

            assert stu_data["type"] == "message"
            assert stu_data["message"]["content"] == "Hello Alex. I'm here to support you. Let's talk about what feels heaviest right now."
            assert stu_data["message"]["sender_role"] == "counselor"

    # Verify messages are persisted in PostgreSQL
    msgs = db_session.query(Message).filter(Message.conversation_id == conv_id).order_by(Message.created_at.asc()).all()
    assert len(msgs) >= 2
    assert msgs[0].content == "Hello Dr. Priya, I need help with exam anxiety."
    assert msgs[1].content == "Hello Alex. I'm here to support you. Let's talk about what feels heaviest right now."


def test_empty_and_oversized_messages_rejected(client, chat_fixture):
    conv_id = chat_fixture["conversation"].id
    stu_token = chat_fixture["stu_token"]

    with client.websocket_connect(f"/api/v1/ws/chat/{conv_id}?token={stu_token}") as ws:
        # Send empty message
        ws.send_json({"type": "message", "content": "   "})
        res = ws.receive_json()
        if res.get("type") == "user_status":
            res = ws.receive_json()
        assert res["type"] == "error"
        assert res["code"] == "INVALID_MESSAGE"

        # Send oversized message
        oversized = "a" * 2005
        ws.send_json({"type": "message", "content": oversized})
        res2 = ws.receive_json()
        assert res2["type"] == "error"
        assert res2["code"] == "INVALID_MESSAGE"


def test_typing_indicator_broadcast(client, chat_fixture):
    conv_id = chat_fixture["conversation"].id
    stu_token = chat_fixture["stu_token"]
    coun_token = chat_fixture["coun_token"]

    with client.websocket_connect(f"/api/v1/ws/chat/{conv_id}?token={stu_token}") as stu_ws:
        with client.websocket_connect(f"/api/v1/ws/chat/{conv_id}?token={coun_token}") as coun_ws:
            # Student sends typing event
            stu_ws.send_json({"type": "typing", "is_typing": True})

            # Counselor receives typing indicator
            coun_data = coun_ws.receive_json()
            if coun_data.get("type") == "user_status":
                coun_data = coun_ws.receive_json()

            assert coun_data["type"] == "typing"
            assert coun_data["sender_role"] == "student"
            assert coun_data["is_typing"] is True


def test_get_appointment_conversation_rest_endpoint(client, chat_fixture):
    apt_id = chat_fixture["appointment"].id
    stu_token = chat_fixture["stu_token"]

    res = client.get(
        f"/api/v1/messages/appointment/{apt_id}/conversation",
        headers={"Authorization": f"Bearer {stu_token}"}
    )
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["appointment_id"] == apt_id
    assert data["is_chat_enabled"] is True
    assert "conversation_id" in data


def test_rest_message_history_retrieval(client, chat_fixture, db_session: Session):
    conv_id = chat_fixture["conversation"].id
    stu_token = chat_fixture["stu_token"]
    stu_user = chat_fixture["student_user"]

    # Insert a test message directly
    msg = Message(
        conversation_id=conv_id,
        sender_id=stu_user.id,
        sender_role="student",
        content="Prior message saved in history.",
        is_read=True
    )
    db_session.add(msg)
    db_session.commit()

    res = client.get(
        f"/api/v1/messages/{conv_id}",
        headers={"Authorization": f"Bearer {stu_token}"}
    )
    assert res.status_code == 200
    msgs = res.json()["data"]
    assert any(m["content"] == "Prior message saved in history." for m in msgs)
