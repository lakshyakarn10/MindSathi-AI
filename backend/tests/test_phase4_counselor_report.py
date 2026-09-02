"""
Phase 4 Test Suite: Counselor Wellness Report + Escalation Case Presentation

Tests:
1.  Counselor can access assigned case report
2.  Same-institution counselor can access the report
3.  Unauthorized counselor (different institution) receives 403
4.  Student cannot access counselor report (403)
5.  Admin cannot access counselor report (403)
6.  Report contains current wellness score
7.  Report contains risk indicator within 1.0-10.0
8.  Report contains risk level
9.  Previous risk is calculated correctly (or null when insufficient data)
10. Trend is included in report
11. Behavioral changes are included (or graceful empty when no baseline)
12. Risk factors are included with contributions
13. No fabricated values - null when data is unavailable
14. Insufficient historical data handled gracefully
15. Crisis/safety priority is represented correctly
16. Counselor case update action still works (regression)
17. Case audit/notes still persist (regression)
"""
from datetime import datetime, timezone, timedelta
import pytest
from app.models.risk import EscalationCase, EscalationStatus
from app.models.wellness import WellnessCheckin, RiskLevel
from app.models.counselor import Counselor, VerificationStatus, AvailabilityStatus
from app.models.user import User, UserRole
from app.models.student import Student
from app.core.security import get_password_hash, create_access_token


# ============================================================================
# HELPER: create a test escalation case for a given student
# ============================================================================

def make_escalation_case(db_session, student_id: str, counselor_id: str = None, risk_level=RiskLevel.HIGH) -> EscalationCase:
    """Creates and persists an escalation case for the student."""
    case = EscalationCase(
        student_id=student_id,
        assigned_counselor_id=counselor_id,
        risk_level=risk_level,
        risk_score=72,
        trigger_reason="High wellness risk detected via multivariate engine.",
        status=EscalationStatus.NEW,
        factors_json={
            "mood": 18,
            "stress": 15,
            "sleep": 11,
            "journal": 14,
            "checkin": 10,
            "behavioral_change": 12,
            "conversation_signals": 8,
            "crisis_indicator": 0
        }
    )
    db_session.add(case)
    db_session.commit()
    db_session.refresh(case)
    return case


def make_wellness_checkin(db_session, student_id: str, days_ago: int = 0, **kwargs) -> WellnessCheckin:
    """Creates a wellness check-in at a specific time offset."""
    defaults = dict(
        student_id=student_id,
        mood_score=4,
        stress_score=8,
        energy_score=3,
        sleep_hours=5.0,
        sleep_quality=4,
        academic_stress=8,
        social_connection=4,
        wellness_score=42.0,
        risk_indicator=7.2,
        risk_level=RiskLevel.HIGH,
        sentiment_score=-0.4,
    )
    defaults.update(kwargs)
    defaults["created_at"] = datetime.now(timezone.utc) - timedelta(days=days_ago)
    ck = WellnessCheckin(**defaults)
    db_session.add(ck)
    db_session.commit()
    db_session.refresh(ck)
    return ck


# ============================================================================
# 1. Counselor (assigned) can access case report
# ============================================================================

def test_assigned_counselor_can_access_report(client, counselor_user, counselor_token, student_user, db_session):
    counselor = counselor_user.counselor_profile
    student = student_user.student_profile
    case = make_escalation_case(db_session, student.id, counselor_id=counselor.id)

    res = client.get(
        f"/api/v1/counselor/cases/{case.id}/report",
        headers={"Authorization": f"Bearer {counselor_token}"}
    )
    assert res.status_code == 200
    data = res.json()["data"]
    assert "risk" in data
    assert "student_reference" in data
    assert data["student_reference"] == student.anonymous_id


# ============================================================================
# 2. Same-institution counselor can access report even if not assigned
# ============================================================================

def test_same_institution_counselor_can_access_report(
    client, student_user, db_session, test_institution
):
    # Create second counselor in same institution (no assignment)
    u2 = User(
        email="counselor2_p4@mindsaathi.demo",
        password_hash=get_password_hash("password123"),
        full_name="Dr. Second Counselor",
        role=UserRole.COUNSELOR,
        is_active=True,
        is_verified=True
    )
    db_session.add(u2)
    db_session.flush()
    c2 = Counselor(
        user_id=u2.id,
        institution_id=test_institution.id,
        professional_role="Counselor",
        employee_id="EMP-C2-P4",
        verification_status=VerificationStatus.APPROVED,
        availability_status=AvailabilityStatus.AVAILABLE
    )
    db_session.add(c2)
    db_session.commit()
    token2 = create_access_token(subject=u2.id, role="counselor")

    student = student_user.student_profile
    case = make_escalation_case(db_session, student.id)  # unassigned

    res = client.get(
        f"/api/v1/counselor/cases/{case.id}/report",
        headers={"Authorization": f"Bearer {token2}"}
    )
    assert res.status_code == 200


# ============================================================================
# 3. Counselor from a DIFFERENT institution is denied (403)
# ============================================================================

def test_different_institution_counselor_denied(
    client, student_user, db_session
):
    # Create a separate institution
    from app.models.institution import Institution
    other_inst = Institution(
        name="Other University",
        code="OTHER-INST-P4",
        country="India",
        timezone="Asia/Kolkata",
        privacy_threshold=15
    )
    db_session.add(other_inst)
    db_session.flush()

    # Counselor from other institution
    u_other = User(
        email="counselor_other_p4@mindsaathi.demo",
        password_hash=get_password_hash("password123"),
        full_name="Dr. Other Counselor",
        role=UserRole.COUNSELOR,
        is_active=True,
        is_verified=True
    )
    db_session.add(u_other)
    db_session.flush()
    c_other = Counselor(
        user_id=u_other.id,
        institution_id=other_inst.id,
        professional_role="Counselor",
        employee_id="EMP-OTHER-P4",
        verification_status=VerificationStatus.APPROVED,
        availability_status=AvailabilityStatus.AVAILABLE
    )
    db_session.add(c_other)
    db_session.commit()
    token_other = create_access_token(subject=u_other.id, role="counselor")

    student = student_user.student_profile
    case = make_escalation_case(db_session, student.id)

    res = client.get(
        f"/api/v1/counselor/cases/{case.id}/report",
        headers={"Authorization": f"Bearer {token_other}"}
    )
    assert res.status_code == 403


# ============================================================================
# 4. Student cannot access counselor report (403)
# ============================================================================

def test_student_cannot_access_counselor_report(
    client, student_user, student_token, db_session
):
    student = student_user.student_profile
    case = make_escalation_case(db_session, student.id)

    res = client.get(
        f"/api/v1/counselor/cases/{case.id}/report",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert res.status_code == 403


# ============================================================================
# 5. Admin cannot access counselor report (403)
# ============================================================================

def test_admin_cannot_access_counselor_report(
    client, admin_user, admin_token, student_user, db_session
):
    student = student_user.student_profile
    case = make_escalation_case(db_session, student.id)

    res = client.get(
        f"/api/v1/counselor/cases/{case.id}/report",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res.status_code == 403


# ============================================================================
# 6-8. Report contains wellness_score, risk_indicator, risk_level
# ============================================================================

def test_report_contains_core_risk_fields(
    client, counselor_user, counselor_token, student_user, db_session
):
    counselor = counselor_user.counselor_profile
    student = student_user.student_profile

    make_wellness_checkin(db_session, student.id, days_ago=0)
    case = make_escalation_case(db_session, student.id, counselor_id=counselor.id)

    res = client.get(
        f"/api/v1/counselor/cases/{case.id}/report",
        headers={"Authorization": f"Bearer {counselor_token}"}
    )
    assert res.status_code == 200
    risk = res.json()["data"]["risk"]

    assert "wellness_score" in risk
    assert 0.0 <= risk["wellness_score"] <= 100.0

    assert "risk_indicator" in risk
    assert 1.0 <= risk["risk_indicator"] <= 10.0

    assert "risk_level" in risk
    assert risk["risk_level"].lower() in ("low", "moderate", "high", "critical")


# ============================================================================
# 9. Previous risk indicator calculation
# ============================================================================

def test_previous_risk_indicator_calculated(
    client, counselor_user, counselor_token, student_user, db_session
):
    counselor = counselor_user.counselor_profile
    student = student_user.student_profile

    # Create two checkins: previous then current
    make_wellness_checkin(db_session, student.id, days_ago=3,
                          risk_indicator=5.2, mood_score=6, stress_score=5,
                          wellness_score=60.0, risk_level=RiskLevel.MODERATE)
    make_wellness_checkin(db_session, student.id, days_ago=0,
                          risk_indicator=7.8, mood_score=3, stress_score=9,
                          wellness_score=38.0, risk_level=RiskLevel.HIGH)

    case = make_escalation_case(db_session, student.id, counselor_id=counselor.id)

    res = client.get(
        f"/api/v1/counselor/cases/{case.id}/report",
        headers={"Authorization": f"Bearer {counselor_token}"}
    )
    assert res.status_code == 200
    risk = res.json()["data"]["risk"]

    assert risk["previous_risk_indicator"] is not None
    assert risk["risk_change"] is not None
    # Current is latest (7.8), previous should be earlier
    assert isinstance(risk["previous_risk_indicator"], float)


# ============================================================================
# 10. Trend is included
# ============================================================================

def test_report_includes_trend(
    client, counselor_user, counselor_token, student_user, db_session
):
    counselor = counselor_user.counselor_profile
    student = student_user.student_profile
    case = make_escalation_case(db_session, student.id, counselor_id=counselor.id)

    res = client.get(
        f"/api/v1/counselor/cases/{case.id}/report",
        headers={"Authorization": f"Bearer {counselor_token}"}
    )
    assert res.status_code == 200
    risk = res.json()["data"]["risk"]
    assert "trend" in risk
    assert risk["trend"] in ("IMPROVING", "STABLE", "DECLINING")


# ============================================================================
# 11. Behavioral changes included (or graceful empty state)
# ============================================================================

def test_report_includes_behavioral_changes(
    client, counselor_user, counselor_token, student_user, db_session
):
    counselor = counselor_user.counselor_profile
    student = student_user.student_profile
    case = make_escalation_case(db_session, student.id, counselor_id=counselor.id)

    res = client.get(
        f"/api/v1/counselor/cases/{case.id}/report",
        headers={"Authorization": f"Bearer {counselor_token}"}
    )
    assert res.status_code == 200
    data = res.json()["data"]
    # behavioral_changes is always a list (may be empty if no baseline)
    assert "behavioral_changes" in data
    assert isinstance(data["behavioral_changes"], list)


# ============================================================================
# 12. Risk factors included with contributions > 0
# ============================================================================

def test_report_includes_risk_factors(
    client, counselor_user, counselor_token, student_user, db_session
):
    counselor = counselor_user.counselor_profile
    student = student_user.student_profile
    case = make_escalation_case(db_session, student.id, counselor_id=counselor.id)

    res = client.get(
        f"/api/v1/counselor/cases/{case.id}/report",
        headers={"Authorization": f"Bearer {counselor_token}"}
    )
    assert res.status_code == 200
    factors = res.json()["data"]["risk_factors"]
    assert isinstance(factors, list)
    assert len(factors) > 0
    # Each factor has required fields
    for f in factors:
        assert "factor" in f
        assert "label" in f
        assert "contribution" in f
        assert f["contribution"] > 0


# ============================================================================
# 13. No fabricated values - previous_risk_indicator null when only 1 checkin
# ============================================================================

def test_no_fabricated_previous_risk_when_single_checkin(
    client, counselor_user, counselor_token, test_institution, db_session
):
    # Fresh student with only ONE checkin
    u_fresh = User(
        email="fresh_p4_single@mindsaathi.demo",
        password_hash=get_password_hash("password123"),
        full_name="Fresh Student P4",
        role=UserRole.STUDENT,
        is_active=True,
        is_verified=True
    )
    db_session.add(u_fresh)
    db_session.flush()
    s_fresh = Student(
        user_id=u_fresh.id,
        anonymous_id="STU-P4-SINGLE",
        institution_id=test_institution.id,
        department="Physics",
        year_of_study=1,
        onboarding_completed=True
    )
    db_session.add(s_fresh)
    db_session.flush()
    # Single checkin
    make_wellness_checkin(db_session, s_fresh.id, days_ago=0)
    counselor = counselor_user.counselor_profile
    case = make_escalation_case(db_session, s_fresh.id, counselor_id=counselor.id)
    db_session.commit()

    res = client.get(
        f"/api/v1/counselor/cases/{case.id}/report",
        headers={"Authorization": f"Bearer {counselor_token}"}
    )
    assert res.status_code == 200
    risk = res.json()["data"]["risk"]
    # With only one checkin, previous must be null
    assert risk["previous_risk_indicator"] is None
    assert risk["risk_change"] is None


# ============================================================================
# 14. No checkins handled gracefully
# ============================================================================

def test_report_with_no_checkins_handled_gracefully(
    client, counselor_user, counselor_token, test_institution, db_session
):
    # Fresh student with NO checkins
    u_empty = User(
        email="empty_p4_nocheckin@mindsaathi.demo",
        password_hash=get_password_hash("password123"),
        full_name="Empty Student P4",
        role=UserRole.STUDENT,
        is_active=True,
        is_verified=True
    )
    db_session.add(u_empty)
    db_session.flush()
    s_empty = Student(
        user_id=u_empty.id,
        anonymous_id="STU-P4-EMPTY",
        institution_id=test_institution.id,
        department="Chemistry",
        year_of_study=2,
        onboarding_completed=True
    )
    db_session.add(s_empty)
    db_session.flush()

    counselor = counselor_user.counselor_profile
    case = make_escalation_case(db_session, s_empty.id, counselor_id=counselor.id)
    db_session.commit()

    res = client.get(
        f"/api/v1/counselor/cases/{case.id}/report",
        headers={"Authorization": f"Bearer {counselor_token}"}
    )
    assert res.status_code == 200
    risk = res.json()["data"]["risk"]
    assert risk["previous_risk_indicator"] is None
    # Risk values derived from case data
    assert 1.0 <= risk["risk_indicator"] <= 10.0


# ============================================================================
# 15. Crisis/safety priority represented correctly
# ============================================================================

def test_crisis_case_shows_safety_indicator(
    client, counselor_user, counselor_token, student_user, db_session
):
    counselor = counselor_user.counselor_profile
    student = student_user.student_profile

    crisis_case = EscalationCase(
        student_id=student.id,
        assigned_counselor_id=counselor.id,
        risk_level=RiskLevel.CRITICAL,
        risk_score=92,
        trigger_reason="Crisis safety indicator detected in companion session.",
        status=EscalationStatus.NEW,
        factors_json={
            "mood": 18,
            "stress": 15,
            "sleep": 11,
            "journal": 14,
            "checkin": 10,
            "behavioral_change": 12,
            "conversation_signals": 8,
            "crisis_indicator": 25  # Crisis flag stored
        }
    )
    db_session.add(crisis_case)
    db_session.commit()

    res = client.get(
        f"/api/v1/counselor/cases/{crisis_case.id}/report",
        headers={"Authorization": f"Bearer {counselor_token}"}
    )
    assert res.status_code == 200
    data = res.json()["data"]
    safety = data.get("safety")
    assert safety is not None
    assert safety["safety_indicator_detected"] is True
    assert "CRITICAL" in safety["priority"].upper()
    assert "Immediate" in safety["action"]


# ============================================================================
# 16. Counselor case update action still works (regression)
# ============================================================================

def test_counselor_case_update_action_regression(
    client, counselor_user, counselor_token, student_user, db_session
):
    counselor = counselor_user.counselor_profile
    student = student_user.student_profile
    case = make_escalation_case(db_session, student.id, counselor_id=counselor.id)

    update_res = client.patch(
        f"/api/v1/counselor/cases/{case.id}",
        headers={"Authorization": f"Bearer {counselor_token}"},
        json={"status": "reviewing", "notes": "Counselor has initiated review of Phase 4 test case."}
    )
    assert update_res.status_code == 200
    assert update_res.json()["data"]["status"] == "reviewing"


# ============================================================================
# 17. Audit/notes persist correctly after update (regression)
# ============================================================================

def test_case_notes_persist_after_update(
    client, counselor_user, counselor_token, student_user, db_session
):
    counselor = counselor_user.counselor_profile
    student = student_user.student_profile
    case = make_escalation_case(db_session, student.id, counselor_id=counselor.id)

    client.patch(
        f"/api/v1/counselor/cases/{case.id}",
        headers={"Authorization": f"Bearer {counselor_token}"},
        json={"notes": "Phase 4 regression note check."}
    )

    # Verify via case detail endpoint
    detail_res = client.get(
        f"/api/v1/counselor/cases/{case.id}",
        headers={"Authorization": f"Bearer {counselor_token}"}
    )
    assert detail_res.status_code == 200
    assert "Phase 4 regression" in (detail_res.json()["data"]["notes"] or "")
