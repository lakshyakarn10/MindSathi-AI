from typing import Dict, Any, Optional
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.models.wellness import WellnessCheckin, RiskLevel
from app.models.risk import EscalationCase, EscalationStatus
from app.models.counselor import Counselor, VerificationStatus
from app.models.notification import Notification, NotificationType

def evaluate_and_escalate(
    db: Session,
    student_id: str,
    latest_checkin: WellnessCheckin,
    risk_info: Dict[str, Any],
    crisis_res: Dict[str, Any]
) -> Optional[EscalationCase]:
    """
    Evaluates sustained risk persistence and creates an escalation case if needed.
    """
    is_crisis = crisis_res.get("crisis_indicator", False)
    risk_level = risk_info.get("risk_level", RiskLevel.LOW)
    risk_score = risk_info.get("risk_score", 0)

    # Check for consecutive concerning check-ins
    past_checkins = db.query(WellnessCheckin).filter(
        WellnessCheckin.student_id == student_id
    ).order_by(WellnessCheckin.created_at.desc()).limit(5).all()

    concerning_count = sum(1 for c in past_checkins if c.risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL] or c.mood_score <= 3 or c.stress_score >= 8)

    should_escalate = is_crisis or risk_level == RiskLevel.CRITICAL or concerning_count >= 3

    if not should_escalate:
        return None

    # Check if an active non-resolved escalation case already exists for this student
    existing_case = db.query(EscalationCase).filter(
        EscalationCase.student_id == student_id,
        EscalationCase.status.in_([EscalationStatus.NEW, EscalationStatus.REVIEWING, EscalationStatus.CONTACTED, EscalationStatus.SESSION_SCHEDULED, EscalationStatus.MONITORING])
    ).first()

    if existing_case:
        # Update existing case details and risk score
        existing_case.risk_score = max(existing_case.risk_score, risk_score)
        existing_case.risk_level = risk_level
        existing_case.factors_json = risk_info.get("factors")
        if is_crisis:
            existing_case.trigger_reason = "Acute safety indicator flagged"
        return existing_case

    # Find available approved counselor to assign
    counselor = db.query(Counselor).filter(
        Counselor.verification_status == VerificationStatus.APPROVED
    ).first()

    reason = "Acute safety indicator flagged" if is_crisis else "Sustained distress signals detected across multiple check-ins"

    new_case = EscalationCase(
        student_id=student_id,
        assigned_counselor_id=counselor.id if counselor else None,
        risk_level=risk_level,
        risk_score=risk_score,
        trigger_reason=reason,
        status=EscalationStatus.NEW,
        factors_json=risk_info.get("factors")
    )
    db.add(new_case)
    db.flush()

    # Create counselor notification if counselor assigned
    if counselor:
        notif = Notification(
            user_id=counselor.user_id,
            type=NotificationType.ESCALATION_UPDATE,
            title="High-Priority Support Case Flagged",
            message=f"Student case requires clinical review: {reason}.",
            reference_type="case",
            reference_id=new_case.id,
            link_tab="High-risk cases"
        )
        db.add(notif)

    return new_case
