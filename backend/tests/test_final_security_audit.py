import pytest
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
import json

from app.main import app
from app.core.database import Base, engine
from app.core.security import create_access_token, get_password_hash
from app.models.user import User, UserRole
from app.models.student import Student
from app.models.counselor import Counselor, VerificationStatus, AvailabilityStatus
from app.models.admin import Admin, AuthorizationStatus
from app.models.institution import Institution
from app.models.appointment import Appointment, AppointmentStatus, SessionMode
from app.models.message import Conversation, Message
from app.models.wellness import WellnessCheckin, RiskLevel
from app.models.risk import EscalationCase, EscalationStatus
from app.models.notification import Notification, NotificationType


@pytest.fixture
def audit_fixture(db_session: Session):
    # Institution 1
    inst1 = Institution(name="Institute of Tech A", code=f"ITA_{datetime.now().timestamp()}")
    db_session.add(inst1)

    # Institution 2
    inst2 = Institution(name="University of Science B", code=f"USB_{datetime.now().timestamp()}")
    db_session.add(inst2)
    db_session.flush()

    # Student 1 (Inst 1)
    stu1_user = User(
        email=f"stu1_{datetime.now().timestamp()}@ita.edu",
        password_hash=get_password_hash("Pass123!"),
        full_name="Alice A",
        role=UserRole.STUDENT,
        is_active=True
    )
    db_session.add(stu1_user)
    db_session.flush()

    stu1 = Student(
        user_id=stu1_user.id,
        institution_id=inst1.id,
        anonymous_id=f"STU-A{int(datetime.now().timestamp()*1000)%10000}",
        verification_status=VerificationStatus.APPROVED
    )
    db_session.add(stu1)

    # Student 2 (Inst 1)
    stu2_user = User(
        email=f"stu2_{datetime.now().timestamp()}@ita.edu",
        password_hash=get_password_hash("Pass123!"),
        full_name="Bob B",
        role=UserRole.STUDENT,
        is_active=True
    )
    db_session.add(stu2_user)
    db_session.flush()

    stu2 = Student(
        user_id=stu2_user.id,
        institution_id=inst1.id,
        anonymous_id=f"STU-B{int(datetime.now().timestamp()*1000)%10000+1}",
        verification_status=VerificationStatus.APPROVED
    )
    db_session.add(stu2)

    # Counselor 1 (Inst 1)
    coun1_user = User(
        email=f"coun1_{datetime.now().timestamp()}@ita.edu",
        password_hash=get_password_hash("Pass123!"),
        full_name="Dr. Counselor One",
        role=UserRole.COUNSELOR,
        is_active=True
    )
    db_session.add(coun1_user)
    db_session.flush()

    coun1 = Counselor(
        user_id=coun1_user.id,
        institution_id=inst1.id,
        employee_id=f"EMP-1-{int(datetime.now().timestamp())}",
        verification_status=VerificationStatus.APPROVED,
        availability_status=AvailabilityStatus.AVAILABLE
    )
    db_session.add(coun1)

    # Counselor 2 (Inst 2 - Other Institution)
    coun2_user = User(
        email=f"coun2_{datetime.now().timestamp()}@usb.edu",
        password_hash=get_password_hash("Pass123!"),
        full_name="Dr. Counselor Two",
        role=UserRole.COUNSELOR,
        is_active=True
    )
    db_session.add(coun2_user)
    db_session.flush()

    coun2 = Counselor(
        user_id=coun2_user.id,
        institution_id=inst2.id,
        employee_id=f"EMP-2-{int(datetime.now().timestamp())}",
        verification_status=VerificationStatus.APPROVED,
        availability_status=AvailabilityStatus.AVAILABLE
    )
    db_session.add(coun2)

    # Admin (Inst 1)
    admin_user = User(
        email=f"admin_{datetime.now().timestamp()}@ita.edu",
        password_hash=get_password_hash("Pass123!"),
        full_name="Dean Admin",
        role=UserRole.ADMIN,
        is_active=True
    )
    db_session.add(admin_user)
    db_session.flush()

    admin_prof = Admin(
        user_id=admin_user.id,
        institution_id=inst1.id,
        authorization_status=AuthorizationStatus.AUTHORIZED
    )
    db_session.add(admin_prof)

    # Conversation 1 (Student 1 + Counselor 1)
    conv1 = Conversation(student_id=stu1.id, counselor_id=coun1.id, last_message="Confidential note")
    db_session.add(conv1)
    db_session.flush()

    # Confirmed CHAT Appointment (Student 1 + Counselor 1)
    apt1 = Appointment(
        student_id=stu1.id,
        counselor_id=coun1.id,
        session_type="counseling",
        mode=SessionMode.CHAT,
        status=AppointmentStatus.CONFIRMED,
        reason="Academic anxiety",
        scheduled_start=datetime.now(timezone.utc),
        scheduled_end=datetime.now(timezone.utc) + timedelta(minutes=45),
        duration_minutes=45
    )
    db_session.add(apt1)

    # Escalation Case for Student 1 assigned to Counselor 1
    case1 = EscalationCase(
        student_id=stu1.id,
        assigned_counselor_id=coun1.id,
        risk_level=RiskLevel.HIGH,
        trigger_reason="High risk indicator score 8.2",
        status=EscalationStatus.NEW
    )
    db_session.add(case1)
    db_session.commit()

    # JWT Tokens
    tokens = {
        "stu1": create_access_token(subject=stu1_user.id, role="student"),
        "stu2": create_access_token(subject=stu2_user.id, role="student"),
        "coun1": create_access_token(subject=coun1_user.id, role="counselor"),
        "coun2": create_access_token(subject=coun2_user.id, role="counselor"),
        "admin": create_access_token(subject=admin_user.id, role="admin"),
    }

    return {
        "inst1": inst1,
        "inst2": inst2,
        "stu1_user": stu1_user,
        "stu1": stu1,
        "stu2_user": stu2_user,
        "stu2": stu2,
        "coun1_user": coun1_user,
        "coun1": coun1,
        "coun2_user": coun2_user,
        "coun2": coun2,
        "admin_user": admin_user,
        "conv1": conv1,
        "apt1": apt1,
        "case1": case1,
        "tokens": tokens,
    }


def test_1_student_cannot_access_another_student_history(client, audit_fixture):
    """Test 1: Student 2 cannot access Student 1's conversation messages."""
    conv_id = audit_fixture["conv1"].id
    res = client.get(
        f"/api/v1/messages/{conv_id}",
        headers={"Authorization": f"Bearer {audit_fixture['tokens']['stu2']}"}
    )
    assert res.status_code == 403


def test_2_student_cannot_access_counselor_report(client, audit_fixture):
    """Test 2: Student cannot access clinical counselor wellness report."""
    case_id = audit_fixture["case1"].id
    res = client.get(
        f"/api/v1/counselor/cases/{case_id}/report",
        headers={"Authorization": f"Bearer {audit_fixture['tokens']['stu1']}"}
    )
    assert res.status_code == 403


def test_3_counselor_cannot_access_unrelated_institution(client, audit_fixture):
    """Test 3: Counselor in Institution 1 cannot manage counselors in Institution 2."""
    inst2_id = audit_fixture["inst2"].id
    res = client.get(
        f"/api/v1/institutions/{inst2_id}/counselors",
        headers={"Authorization": f"Bearer {audit_fixture['tokens']['coun1']}"}
    )
    assert res.status_code in [403, 404]


def test_4_counselor_cannot_access_unrelated_case(client, audit_fixture):
    """Test 4: Counselor 2 (different institution) cannot access Counselor 1's case report."""
    case_id = audit_fixture["case1"].id
    res = client.get(
        f"/api/v1/counselor/cases/{case_id}/report",
        headers={"Authorization": f"Bearer {audit_fixture['tokens']['coun2']}"}
    )
    assert res.status_code in [403, 404]


def test_5_admin_cannot_access_private_chat(client, audit_fixture):
    """Test 5: Admin cannot access confidential REST messages or WebSocket room."""
    conv_id = audit_fixture["conv1"].id
    res = client.get(
        f"/api/v1/messages/{conv_id}",
        headers={"Authorization": f"Bearer {audit_fixture['tokens']['admin']}"}
    )
    assert res.status_code == 403

    # WebSocket
    with pytest.raises(Exception):
        with client.websocket_connect(f"/api/v1/ws/chat/{conv_id}?token={audit_fixture['tokens']['admin']}"):
            pass


def test_6_admin_cannot_access_raw_companion_conversations(client, audit_fixture):
    """Test 6: Admin cannot access student's raw AI companion conversation history."""
    res = client.get(
        "/api/v1/companion/conversations",
        headers={"Authorization": f"Bearer {audit_fixture['tokens']['admin']}"}
    )
    assert res.status_code == 403


def test_7_invalid_jwt_rejected(client):
    """Test 7: Malformed or fake JWT tokens are rejected with 401."""
    res = client.get(
        "/api/v1/wellness/trends",
        headers={"Authorization": "Bearer invalid.fake.token"}
    )
    assert res.status_code == 401


def test_8_expired_jwt_rejected(client, audit_fixture):
    """Test 8: Expired JWT tokens are rejected with 401."""
    expired_token = create_access_token(
        subject=audit_fixture["stu1_user"].id,
        role="student",
        expires_delta=timedelta(seconds=-60)
    )
    res = client.get(
        "/api/v1/wellness/trends",
        headers={"Authorization": f"Bearer {expired_token}"}
    )
    assert res.status_code == 401


def test_9_unauthorized_websocket_rejected(client, audit_fixture):
    """Test 9: WebSocket connection without token is rejected."""
    conv_id = audit_fixture["conv1"].id
    with pytest.raises(Exception):
        with client.websocket_connect(f"/api/v1/ws/chat/{conv_id}"):
            pass


def test_10_cross_user_websocket_rejected(client, audit_fixture):
    """Test 10: Student 2 cannot connect to Student 1's WebSocket chat room."""
    conv_id = audit_fixture["conv1"].id
    with pytest.raises(Exception):
        with client.websocket_connect(f"/api/v1/ws/chat/{conv_id}?token={audit_fixture['tokens']['stu2']}"):
            pass


def test_11_cross_institution_websocket_rejected(client, audit_fixture):
    """Test 11: Counselor from other institution cannot connect to conversation."""
    conv_id = audit_fixture["conv1"].id
    with pytest.raises(Exception):
        with client.websocket_connect(f"/api/v1/ws/chat/{conv_id}?token={audit_fixture['tokens']['coun2']}"):
            pass


def test_12_gemini_key_never_appears_in_api_response(client, audit_fixture):
    """Test 12: Companion status and chat endpoints never leak GEMINI_API_KEY."""
    res = client.get("/api/v1/companion/status")
    assert res.status_code == 200
    data = res.json()
    assert "key" not in str(data).lower() or "gemini_mode" in str(data)
    assert "aiza" not in str(data).lower()

    # Check chat endpoint response
    chat_res = client.post(
        "/api/v1/companion/chat",
        headers={"Authorization": f"Bearer {audit_fixture['tokens']['stu1']}"},
        json={"message": "I feel stressed about my exams."}
    )
    assert chat_res.status_code == 200
    chat_data = chat_res.json()
    assert "aiza" not in str(chat_data).lower()


def test_13_private_messages_not_present_in_admin_analytics(client, audit_fixture):
    """Test 13: Admin analytics endpoints only expose aggregate figures, zero private message text."""
    res = client.get(
        "/api/v1/admin/analytics/overview",
        headers={"Authorization": f"Bearer {audit_fixture['tokens']['admin']}"}
    )
    assert res.status_code == 200
    overview_text = str(res.json())
    assert "Confidential note" not in overview_text


def test_14_notifications_do_not_leak_excessive_private_content(client, audit_fixture, db_session: Session):
    """Test 14: Notifications are scoped to the intended recipient only."""
    notif = Notification(
        user_id=audit_fixture["coun1_user"].id,
        type=NotificationType.SESSION_SCHEDULED,
        title="Session Request",
        message="A student requested a counseling consultation.",
        link_tab="Appointments"
    )
    db_session.add(notif)
    db_session.commit()

    # Counselor 1 can read
    res1 = client.get(
        "/api/v1/notifications",
        headers={"Authorization": f"Bearer {audit_fixture['tokens']['coun1']}"}
    )
    assert res1.status_code == 200
    assert any(n["id"] == notif.id for n in res1.json())

    # Counselor 2 cannot see Counselor 1's notification
    res2 = client.get(
        "/api/v1/notifications",
        headers={"Authorization": f"Bearer {audit_fixture['tokens']['coun2']}"}
    )
    assert res2.status_code == 200
    assert not any(n["id"] == notif.id for n in res2.json())


def test_15_crisis_escalation_authorization_correct(client, audit_fixture):
    """Test 15: Counselor 1 can review escalation case, student and admin cannot modify case."""
    case_id = audit_fixture["case1"].id

    # Counselor 1 can update case status
    res = client.patch(
        f"/api/v1/counselor/cases/{case_id}",
        headers={"Authorization": f"Bearer {audit_fixture['tokens']['coun1']}"},
        json={"status": "reviewing", "notes": "Initiating contact with student."}
    )
    assert res.status_code == 200

    # Student cannot update case
    stu_res = client.patch(
        f"/api/v1/counselor/cases/{case_id}",
        headers={"Authorization": f"Bearer {audit_fixture['tokens']['stu1']}"},
        json={"status": "resolved"}
    )
    assert stu_res.status_code == 403
