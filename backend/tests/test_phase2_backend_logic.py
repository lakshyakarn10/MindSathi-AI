from datetime import datetime, timedelta, timezone
import pytest
from app.models.appointment import Appointment, AppointmentStatus, SessionMode
from app.models.wellness import WellnessCheckin, RiskLevel
from app.models.notification import Notification, NotificationType
from app.models.risk import EscalationCase, EscalationStatus
from app.services.behavior_service import compute_baseline, detect_behavioral_changes
from app.ml.risk_engine import calculate_risk
from app.ml.crisis_detector import detect_crisis


# ============================================================================
# PART 1: APPOINTMENT WORKFLOW TESTS
# ============================================================================

def test_counselor_appointment_reject(client, student_token, counselor_token, db_session):
    start_time = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()

    # 1. Student creates appointment request (defaults to pending)
    req_res = client.post(
        "/api/v1/appointments",
        headers={"Authorization": f"Bearer {student_token}"},
        json={
            "session_type": "crisis",
            "mode": "video",
            "reason": "Severe burnout",
            "scheduled_start": start_time,
            "duration_minutes": 45
        }
    )
    assert req_res.status_code == 200
    apt_id = req_res.json()["data"]["id"]
    assert req_res.json()["data"]["status"] == "pending"

    # 2. Counselor rejects appointment with reason
    reject_res = client.patch(
        f"/api/v1/counselor/appointments/{apt_id}/reject",
        headers={"Authorization": f"Bearer {counselor_token}"},
        json={"rejection_reason": "Counselor is on leave during this time slot."}
    )
    assert reject_res.status_code == 200
    data = reject_res.json()["data"]
    assert data["status"] == "rejected"
    assert data["rejection_reason"] == "Counselor is on leave during this time slot."

    # 3. Verify notification received by student
    student_notifs = client.get(
        "/api/v1/notifications",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert student_notifs.status_code == 200
    notifs_list = student_notifs.json()
    notif_messages = [n["message"] for n in notifs_list]
    assert any("unable to accept" in msg or "Counselor is on leave" in msg for msg in notif_messages)


def test_counselor_suggest_alternative_time(client, student_token, counselor_token):
    start_time = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()
    alt_start = (datetime.now(timezone.utc) + timedelta(days=3, hours=2)).isoformat()

    # 1. Create appointment
    req_res = client.post(
        "/api/v1/appointments",
        headers={"Authorization": f"Bearer {student_token}"},
        json={
            "session_type": "follow_up",
            "mode": "video",
            "reason": "Weekly checkup",
            "scheduled_start": start_time,
            "duration_minutes": 45
        }
    )
    apt_id = req_res.json()["data"]["id"]

    # 2. Counselor suggests alternative time
    suggest_res = client.patch(
        f"/api/v1/counselor/appointments/{apt_id}/suggest-time",
        headers={"Authorization": f"Bearer {counselor_token}"},
        json={
            "new_start": alt_start,
            "message": "I have an opening on Thursday afternoon instead."
        }
    )
    assert suggest_res.status_code == 200
    assert suggest_res.json()["data"]["status"] == "rescheduled"

    # 3. Verify notification to student
    student_notifs = client.get(
        "/api/v1/notifications",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert student_notifs.status_code == 200
    titles = [n["title"] for n in student_notifs.json()]
    assert "Alternative Session Time Suggested" in titles


def test_counselor_set_meet_url_and_location(client, student_token, counselor_token):
    start_time = (datetime.now(timezone.utc) + timedelta(days=4)).isoformat()

    # 1. Create video appointment
    req_res = client.post(
        "/api/v1/appointments",
        headers={"Authorization": f"Bearer {student_token}"},
        json={
            "session_type": "counseling",
            "mode": "video",
            "reason": "Stress management",
            "scheduled_start": start_time,
            "duration_minutes": 45
        }
    )
    apt_id = req_res.json()["data"]["id"]

    # 2. Set valid Google Meet URL
    meet_res = client.patch(
        f"/api/v1/counselor/appointments/{apt_id}/meet-url",
        headers={"Authorization": f"Bearer {counselor_token}"},
        json={"meet_url": "https://meet.google.com/xyz-abcd-efg"}
    )
    assert meet_res.status_code == 200
    assert meet_res.json()["data"]["meet_url"] == "https://meet.google.com/xyz-abcd-efg"

    # 3. Invalid meet URL (non-HTTPS or malformed) should fail
    bad_meet_res = client.patch(
        f"/api/v1/counselor/appointments/{apt_id}/meet-url",
        headers={"Authorization": f"Bearer {counselor_token}"},
        json={"meet_url": "http://insecure-link.com"}
    )
    assert bad_meet_res.status_code == 400

    # 4. Set in-person location
    loc_res = client.patch(
        f"/api/v1/counselor/appointments/{apt_id}/location",
        headers={"Authorization": f"Bearer {counselor_token}"},
        json={"location": "Wellness Center Room 104, North Campus"}
    )
    assert loc_res.status_code == 200
    assert loc_res.json()["data"]["location"] == "Wellness Center Room 104, North Campus"

    # 5. Empty location should fail
    bad_loc_res = client.patch(
        f"/api/v1/counselor/appointments/{apt_id}/location",
        headers={"Authorization": f"Bearer {counselor_token}"},
        json={"location": "   "}
    )
    assert bad_loc_res.status_code in [400, 422]


# ============================================================================
# PART 2: CONFIDENTIAL MESSAGE NOTIFICATIONS
# ============================================================================

def test_message_bidirectional_notifications(client, student_token, counselor_token):
    # 1. Student sends message to counselor
    send_stu = client.post(
        "/api/v1/messages",
        headers={"Authorization": f"Bearer {student_token}"},
        json={"content": "Hello counselor, I have a quick question."}
    )
    assert send_stu.status_code == 200
    conv_id = send_stu.json()["data"]["conversation_id"]

    # Counselor should receive notification
    counselor_notifs = client.get(
        "/api/v1/notifications",
        headers={"Authorization": f"Bearer {counselor_token}"}
    )
    assert counselor_notifs.status_code == 200
    c_notif_msgs = [n["message"] for n in counselor_notifs.json()]
    assert any("quick question" in msg for msg in c_notif_msgs)

    # 2. Counselor sends reply to student
    send_coun = client.post(
        "/api/v1/messages",
        headers={"Authorization": f"Bearer {counselor_token}"},
        json={
            "conversation_id": conv_id,
            "content": "Hi there! Feel free to share your thoughts."
        }
    )
    assert send_coun.status_code == 200

    # Student should receive notification
    student_notifs = client.get(
        "/api/v1/notifications",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert student_notifs.status_code == 200
    s_notif_msgs = [n["message"] for n in student_notifs.json()]
    assert any("share your thoughts" in msg for msg in s_notif_msgs)


# ============================================================================
# PARTS 3-8: LONGITUDINAL BASELINE, BEHAVIORAL & SUDDEN CHANGE DETECTION
# ============================================================================

def test_baseline_computation_with_insufficient_and_sufficient_data(db_session, test_institution):
    from app.models.user import User, UserRole
    from app.models.student import Student
    from app.core.security import get_password_hash

    # Create dedicated fresh student for baseline verification
    fresh_user = User(
        email="fresh_baseline_student@mindsaathi.demo",
        password_hash=get_password_hash("password123"),
        full_name="Baseline Student",
        role=UserRole.STUDENT,
        is_active=True,
        is_verified=True
    )
    db_session.add(fresh_user)
    db_session.flush()

    fresh_student = Student(
        user_id=fresh_user.id,
        anonymous_id="STU-7777",
        institution_id=test_institution.id,
        department="Bioengineering",
        year_of_study=1,
        onboarding_completed=True
    )
    db_session.add(fresh_student)
    db_session.commit()

    # 1. Insufficient data (< 2 records)
    baseline_empty = compute_baseline(db_session, fresh_student.id, window_days=14)
    assert baseline_empty["has_sufficient_data"] is False
    assert baseline_empty["averages"] is None

    # 2. Add 3 checkins over the past week
    now = datetime.now(timezone.utc)
    for i in range(3):
        ck = WellnessCheckin(
            student_id=fresh_student.id,
            mood_score=8 - i,          # 8, 7, 6 -> avg = 7.0
            stress_score=4 + i,        # 4, 5, 6 -> avg = 5.0
            energy_score=7,
            sleep_hours=8.0 - (0.5 * i),# 8.0, 7.5, 7.0 -> avg = 7.5
            sleep_quality=8,
            academic_stress=4,
            social_connection=7,
            wellness_score=78.0 - (2.0 * i), # 78, 76, 74 -> avg = 76.0
            risk_indicator=3.0 + (0.5 * i),   # 3.0, 3.5, 4.0 -> avg = 3.5
            created_at=now - timedelta(days=6 - i * 2)
        )
        db_session.add(ck)
    db_session.commit()

    baseline = compute_baseline(db_session, fresh_student.id, window_days=14)
    assert baseline["has_sufficient_data"] is True
    assert baseline["record_count"] >= 3
    assert baseline["averages"]["mood"] == 7.0
    assert baseline["averages"]["stress"] == 5.0
    assert baseline["averages"]["sleep"] == 7.5


def test_behavioral_and_sudden_change_detection():
    baseline = {
        "has_sufficient_data": True,
        "averages": {
            "mood": 7.5,
            "stress": 4.0,
            "energy": 7.0,
            "sleep": 8.0,
            "wellness_score": 78.0,
            "risk_indicator": 3.0
        }
    }

    # 1. Significant mood decline & stress increase -> sudden change detected
    current_severe = {
        "mood_score": 4.5,    # drop of 3.0 (>= 2.0)
        "stress_score": 7.8,  # increase of 3.8 (>= 2.0)
        "energy_score": 4.0,  # drop of 3.0 (>= 2.0)
        "sleep_hours": 5.0,   # drop of 3.0 (>= 2.0)
        "wellness_score": 45.0
    }
    res_severe = detect_behavioral_changes(baseline, current_severe)
    assert res_severe["sudden_change"] is True
    assert res_severe["trend"] == "DECLINING"
    assert res_severe["changes"]["mood"]["severity"] == "significant"
    assert res_severe["changes"]["stress"]["severity"] == "significant"
    assert res_severe["changes"]["sleep"]["severity"] == "significant"

    # 2. Improving trajectory
    current_improving = {
        "mood_score": 9.0,
        "stress_score": 2.5,
        "energy_score": 8.5,
        "sleep_hours": 8.5,
        "wellness_score": 88.0
    }
    res_improving = detect_behavioral_changes(baseline, current_improving)
    assert res_improving["sudden_change"] is False
    assert res_improving["trend"] == "IMPROVING"

    # 3. Stable trajectory
    current_stable = {
        "mood_score": 7.4,
        "stress_score": 4.2,
        "energy_score": 7.1,
        "sleep_hours": 7.8,
        "wellness_score": 77.0
    }
    res_stable = detect_behavioral_changes(baseline, current_stable)
    assert res_stable["sudden_change"] is False
    assert res_stable["trend"] == "STABLE"


def test_risk_engine_behavioral_integration_and_indicator_scaling():
    # 1. Low risk baseline
    risk_low = calculate_risk(
        mood_score=8,
        stress_score=3,
        sleep_hours=8.0,
        sentiment_score=0.6,
        recent_checkins_count=5,
        crisis_flag=False,
        behavior_data={"sudden_change": False, "trend": "STABLE", "concerning_factors_count": 0}
    )
    assert 1.0 <= risk_low["risk_indicator"] <= 10.0
    assert risk_low["risk_level"] == RiskLevel.LOW
    assert risk_low["factors"]["behavioral_change"] >= 0

    # 2. High risk with sudden behavioral change
    risk_high = calculate_risk(
        mood_score=3,
        stress_score=9,
        sleep_hours=4.0,
        sentiment_score=-0.7,
        recent_checkins_count=1,
        crisis_flag=False,
        behavior_data={"sudden_change": True, "trend": "DECLINING", "concerning_factors_count": 3}
    )
    assert risk_high["risk_indicator"] >= 6.0
    assert risk_high["risk_level"] in [RiskLevel.HIGH, RiskLevel.CRITICAL]
    assert risk_high["factors"]["behavioral_change"] > 0

    # 3. Acute crisis detection
    crisis_eval = detect_crisis("I want to end my life and cannot go on")
    assert crisis_eval["crisis_indicator"] is True
    risk_crisis = calculate_risk(
        mood_score=2,
        stress_score=9,
        sleep_hours=3.0,
        sentiment_score=-0.9,
        recent_checkins_count=1,
        crisis_flag=crisis_eval["crisis_indicator"]
    )
    assert risk_crisis["risk_level"] == RiskLevel.CRITICAL
    assert risk_crisis["risk_indicator"] >= 8.0


def test_student_risk_profile_api_endpoint(client, student_token):
    # Perform a daily check-in
    client.post(
        "/api/v1/checkins",
        headers={"Authorization": f"Bearer {student_token}"},
        json={
            "mood_score": 7,
            "stress_score": 4,
            "energy_score": 7,
            "sleep_hours": 7.5,
            "sleep_quality": 8,
            "academic_stress": 4,
            "social_connection": 7,
            "journal_text": "Good day overall, focused on projects."
        }
    )

    # Fetch risk profile
    res = client.get(
        "/api/v1/risk/me",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert res.status_code == 200
    data = res.json()

    assert "wellness_score" in data
    assert "risk_indicator" in data
    assert 1.0 <= data["risk_indicator"] <= 10.0
    assert 0.0 <= data["wellness_score"] <= 100.0
    assert data["trend"] in ["IMPROVING", "STABLE", "DECLINING"]
    assert isinstance(data["sudden_change"], bool)
    assert "factors" in data
