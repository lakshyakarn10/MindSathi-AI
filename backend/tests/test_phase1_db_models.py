from datetime import datetime, timedelta, timezone
import pytest
from app.models.appointment import Appointment, AppointmentStatus, SessionMode
from app.models.wellness import WellnessCheckin, RiskLevel
from app.models.companion import CompanionConversation, CompanionMessage, MessageRole
from app.models.student import Student
from app.models.user import User, UserRole
from app.core.security import get_password_hash


def test_appointment_model_new_fields_and_pending_default(db_session, student_user, counselor_user):
    student = student_user.student_profile
    counselor = counselor_user.counselor_profile
    now = datetime.now(timezone.utc)

    # 1. Create appointment without explicit status - must default to PENDING
    apt = Appointment(
        student_id=student.id,
        counselor_id=counselor.id,
        session_type="counseling",
        mode=SessionMode.VIDEO,
        reason="academic_stress",
        scheduled_start=now + timedelta(days=1),
        scheduled_end=now + timedelta(days=1, minutes=45),
        duration_minutes=45,
        meet_url=None,
        location=None,
        rejection_reason=None
    )
    db_session.add(apt)
    db_session.commit()
    db_session.refresh(apt)

    assert apt.status == AppointmentStatus.PENDING
    assert apt.meet_url is None
    assert apt.location is None
    assert apt.rejection_reason is None

    # 2. Update counselor fields (meet_url for VIDEO mode)
    apt.status = AppointmentStatus.CONFIRMED
    apt.meet_url = "https://meet.google.com/abc-defg-hij"
    db_session.commit()
    db_session.refresh(apt)

    assert apt.status == AppointmentStatus.CONFIRMED
    assert apt.meet_url == "https://meet.google.com/abc-defg-hij"

    # 3. Test in_person location and rejection_reason fields
    apt_in_person = Appointment(
        student_id=student.id,
        counselor_id=counselor.id,
        session_type="counseling",
        mode=SessionMode.IN_PERSON,
        reason="general_support",
        scheduled_start=now + timedelta(days=2),
        scheduled_end=now + timedelta(days=2, minutes=45),
        duration_minutes=45,
        location="Counseling Center Room 302",
        rejection_reason=None
    )
    db_session.add(apt_in_person)
    db_session.commit()
    db_session.refresh(apt_in_person)

    assert apt_in_person.status == AppointmentStatus.PENDING
    assert apt_in_person.location == "Counseling Center Room 302"

    # 4. Rejection with rejection_reason
    apt_in_person.status = AppointmentStatus.REJECTED
    apt_in_person.rejection_reason = "Counselor unavailable at this time slot"
    db_session.commit()
    db_session.refresh(apt_in_person)

    assert apt_in_person.status == AppointmentStatus.REJECTED
    assert apt_in_person.rejection_reason == "Counselor unavailable at this time slot"


def test_appointment_api_starts_as_pending(client, student_token, counselor_token):
    start_time = (datetime.now(timezone.utc) + timedelta(days=3)).isoformat()

    # Create via API
    res = client.post(
        "/api/v1/appointments",
        headers={"Authorization": f"Bearer {student_token}"},
        json={
            "session_type": "counseling",
            "mode": "video",
            "reason": "exam_pressure",
            "scheduled_start": start_time,
            "duration_minutes": 45,
            "student_notes": "First time booking a session"
        }
    )
    assert res.status_code == 200
    apt = res.json()["data"]
    assert apt["status"] == "pending"


def test_wellness_checkin_risk_indicator_validation(db_session, student_user):
    student = student_user.student_profile

    # 1. Valid risk_indicator within 1.0 - 10.0
    checkin_valid = WellnessCheckin(
        student_id=student.id,
        mood_score=6,
        stress_score=6,
        energy_score=5,
        sleep_hours=6.5,
        sleep_quality=6,
        academic_stress=6,
        social_connection=5,
        wellness_score=68.5,
        risk_indicator=4.5,
        risk_level=RiskLevel.MODERATE
    )
    db_session.add(checkin_valid)
    db_session.commit()
    db_session.refresh(checkin_valid)

    assert checkin_valid.risk_indicator == 4.5
    assert checkin_valid.wellness_score == 68.5

    # 2. Boundary values (1.0 and 10.0)
    checkin_min = WellnessCheckin(
        student_id=student.id,
        wellness_score=95.0,
        risk_indicator=1.0,
        risk_level=RiskLevel.LOW
    )
    db_session.add(checkin_min)
    db_session.commit()
    assert checkin_min.risk_indicator == 1.0

    checkin_max = WellnessCheckin(
        student_id=student.id,
        wellness_score=15.0,
        risk_indicator=10.0,
        risk_level=RiskLevel.CRITICAL
    )
    db_session.add(checkin_max)
    db_session.commit()
    assert checkin_max.risk_indicator == 10.0

    # 3. Invalid values (< 1.0 or > 10.0) should raise ValueError
    with pytest.raises(ValueError):
        WellnessCheckin(
            student_id=student.id,
            wellness_score=50.0,
            risk_indicator=0.5,
            risk_level=RiskLevel.LOW
        )

    with pytest.raises(ValueError):
        WellnessCheckin(
            student_id=student.id,
            wellness_score=50.0,
            risk_indicator=11.0,
            risk_level=RiskLevel.CRITICAL
        )


def test_companion_conversation_and_messages_models(db_session, student_user):
    student = student_user.student_profile

    # 1. Create CompanionConversation
    conv = CompanionConversation(
        student_id=student.id
    )
    db_session.add(conv)
    db_session.commit()
    db_session.refresh(conv)

    assert conv.id is not None
    assert conv.student_id == student.id
    assert conv.created_at is not None
    assert conv.updated_at is not None

    # 2. Add CompanionMessages
    msg1 = CompanionMessage(
        conversation_id=conv.id,
        role=MessageRole.STUDENT,
        content="I've been feeling really overwhelmed with assignments."
    )
    msg2 = CompanionMessage(
        conversation_id=conv.id,
        role=MessageRole.ASSISTANT,
        content="I hear you. It sounds like you're carrying a heavy load right now. Would you like to break them down together?"
    )
    db_session.add_all([msg1, msg2])
    db_session.commit()

    db_session.refresh(conv)
    assert len(conv.messages) == 2
    assert conv.messages[0].role == MessageRole.STUDENT
    assert conv.messages[0].content == "I've been feeling really overwhelmed with assignments."
    assert conv.messages[1].role == MessageRole.ASSISTANT
    assert conv.messages[1].conversation_id == conv.id


def test_companion_student_ownership_protection(db_session, student_user, test_institution):
    student1 = student_user.student_profile

    # Create a second student
    user2 = User(
        email="second_student@mindsaathi.demo",
        password_hash=get_password_hash("password123"),
        full_name="Second Student",
        role=UserRole.STUDENT,
        is_active=True,
        is_verified=True
    )
    db_session.add(user2)
    db_session.flush()

    student2 = Student(
        user_id=user2.id,
        anonymous_id="STU-8888",
        institution_id=test_institution.id,
        department="Mechanical Engineering",
        year_of_study=2,
        onboarding_completed=True
    )
    db_session.add(student2)
    db_session.commit()

    # Create conversation for student1
    conv1 = CompanionConversation(student_id=student1.id)
    db_session.add(conv1)
    db_session.commit()

    # Verify query scoping by student_id
    student1_convs = db_session.query(CompanionConversation).filter(CompanionConversation.student_id == student1.id).all()
    student2_convs = db_session.query(CompanionConversation).filter(CompanionConversation.student_id == student2.id).all()

    assert conv1 in student1_convs
    assert conv1 not in student2_convs
    assert len(student2_convs) == 0
