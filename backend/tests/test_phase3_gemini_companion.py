from datetime import datetime, timezone
import pytest
from app.models.companion import CompanionConversation, CompanionMessage, MessageRole
from app.models.risk import EscalationCase, EscalationStatus
from app.models.wellness import WellnessCheckin, RiskLevel
from app.core.gemini_client import (
    generate_gemini_companion_response,
    extract_structured_wellness_observations
)
from app.ml.risk_engine import calculate_risk


def test_companion_chat_creates_conversation_and_messages(client, student_token, db_session):
    # 1. First turn: send message to companion
    res1 = client.post(
        "/api/v1/companion/chat",
        headers={"Authorization": f"Bearer {student_token}"},
        json={"message": "I'm having a really hard time keeping up with exam preparations."}
    )
    assert res1.status_code == 200
    data1 = res1.json()
    assert "response" in data1
    assert "conversation_id" in data1
    assert data1["crisis_detected"] is False
    assert len(data1["suggested_topics"]) >= 1

    conv_id = data1["conversation_id"]

    # Verify records persisted in DB
    conv = db_session.query(CompanionConversation).filter(CompanionConversation.id == conv_id).first()
    assert conv is not None
    assert len(conv.messages) == 2  # 1 student turn + 1 assistant turn
    assert conv.messages[0].role == MessageRole.STUDENT
    assert conv.messages[1].role == MessageRole.ASSISTANT

    # 2. Second turn: continue conversation
    res2 = client.post(
        "/api/v1/companion/chat",
        headers={"Authorization": f"Bearer {student_token}"},
        json={
            "conversation_id": conv_id,
            "message": "Can you give me a simple 5-minute study breakdown strategy?"
        }
    )
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["conversation_id"] == conv_id

    db_session.refresh(conv)
    assert len(conv.messages) == 4


def test_companion_history_and_conversations_api(client, student_token):
    # 1. Fetch history
    res = client.get(
        "/api/v1/companion/history",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert res.status_code == 200
    messages = res.json()["data"]
    assert len(messages) >= 2
    assert messages[0]["role"] == "student"
    assert messages[1]["role"] == "assistant"

    # 2. Fetch conversation sessions list
    convs_res = client.get(
        "/api/v1/companion/conversations",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert convs_res.status_code == 200
    assert len(convs_res.json()["data"]) >= 1


def test_companion_privacy_isolation(client, student_user, test_institution, db_session):
    from app.models.user import User, UserRole
    from app.models.student import Student
    from app.core.security import get_password_hash, create_access_token

    # Create a second student
    user2 = User(
        email="second_companion_stu@mindsaathi.demo",
        password_hash=get_password_hash("password123"),
        full_name="Other Student",
        role=UserRole.STUDENT,
        is_active=True,
        is_verified=True
    )
    db_session.add(user2)
    db_session.flush()

    student2 = Student(
        user_id=user2.id,
        anonymous_id="STU-6666",
        institution_id=test_institution.id,
        department="Electrical",
        year_of_study=2,
        onboarding_completed=True
    )
    db_session.add(student2)
    db_session.commit()

    token2 = create_access_token(subject=user2.id, role="student")

    # Create conversation for student1
    conv1 = CompanionConversation(student_id=student_user.student_profile.id)
    db_session.add(conv1)
    db_session.commit()

    # Student 2 attempts to fetch Student 1's conversation history -> returns empty or not found
    hist_res = client.get(
        f"/api/v1/companion/history?conversation_id={conv1.id}",
        headers={"Authorization": f"Bearer {token2}"}
    )
    assert hist_res.status_code == 200
    assert len(hist_res.json()["data"]) == 0


def test_structured_wellness_observations_extraction():
    messages = [
        {"role": "student", "content": "I haven't slept properly in 4 days because of exam anxiety and failing grades."},
        {"role": "assistant", "content": "I hear you, sleep deprivation makes exam stress much harder."},
        {"role": "student", "content": "I feel completely exhausted and isolated from my classmates."}
    ]

    obs = extract_structured_wellness_observations(messages)
    assert "academic_pressure" in obs["themes"]
    assert "sleep_deprivation" in obs["themes"]
    assert "social_isolation" in obs["themes"]
    assert obs["distress_signals_count"] >= 2
    assert obs["conversational_risk_factor"] > 0
    assert obs["sentiment_score"] < 0.0


def test_risk_engine_integration_with_conversational_signals():
    obs = {
        "conversational_risk_factor": 75.0,
        "distress_signals_count": 3,
        "crisis_flag": False
    }

    risk_res = calculate_risk(
        mood_score=4,
        stress_score=8,
        sleep_hours=5.0,
        sentiment_score=-0.6,
        recent_checkins_count=2,
        crisis_flag=False,
        conversation_signals=obs
    )

    assert 1.0 <= risk_res["risk_indicator"] <= 10.0
    assert risk_res["risk_indicator"] >= 6.0
    assert risk_res["factors"]["conversation_signals"] > 0


def test_companion_crisis_detection_and_counselor_escalation(client, student_token, db_session):
    # Send acute crisis trigger message in companion chat
    res = client.post(
        "/api/v1/companion/chat",
        headers={"Authorization": f"Bearer {student_token}"},
        json={"message": "I cannot take this pain anymore, I want to end my life."}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["crisis_detected"] is True
    assert data["should_offer_counselor"] is True
    assert "Tele-MANAS" in data["response"] or "14416" in data["response"]

    # Verify escalation case created / flagged in DB
    cases = db_session.query(EscalationCase).all()
    assert len(cases) >= 1
    latest_case = cases[-1]
    assert latest_case.risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL]
