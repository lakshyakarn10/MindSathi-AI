"""
CounselorReportService — Phase 4

Generates a structured observational wellness report for a counselor reviewing
an escalation case. This service:
- Does NOT re-calculate risk (uses stored EscalationCase.risk_score / factors_json)
- Retrieves the student's latest and previous wellness check-in data
- Reuses BehaviorService for longitudinal baseline & behavioral change detection
- Extracts AI companion conversation themes from CompanionMessage content
- Generates a deterministic observational summary (no additional Gemini calls)
- Returns counselor-friendly risk factor decomposition

PRIVACY:
- Raw conversation message content is NEVER returned to the counselor.
- Only AI-extracted observational themes and signals are surfaced.
- Report is scoped to counselor's institutional context.
"""
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models.risk import EscalationCase, EscalationStatus
from app.models.wellness import WellnessCheckin, RiskLevel
from app.models.companion import CompanionConversation, CompanionMessage, MessageRole
from app.models.counselor import Counselor
from app.services.behavior_service import compute_baseline, detect_behavioral_changes
from app.core.gemini_client import extract_structured_wellness_observations
from app.core.exceptions import NotFoundError, PermissionDeniedError


# Human-readable labels for risk factor keys
FACTOR_LABELS: Dict[str, str] = {
    "mood": "Mood decline",
    "stress": "Stress increase",
    "sleep": "Sleep reduction",
    "journal": "Negative journaling sentiment",
    "checkin": "Check-in irregularity",
    "behavioral_change": "Behavioral shift detected",
    "conversation_signals": "Conversational distress signals",
    "crisis_indicator": "Safety concern flagged",
}

# Human-readable labels for conversation theme codes
THEME_LABELS: Dict[str, str] = {
    "academic_pressure": "Academic pressure",
    "sleep_deprivation": "Sleep disruption",
    "social_isolation": "Social isolation",
    "anxiety_arousal": "Reported anxiety",
    "burnout_hopelessness": "Signs of burnout or low hope",
}


def generate_counselor_wellness_report(
    db: Session,
    case_id: str,
    counselor_user_id: str,
) -> Dict[str, Any]:
    """
    Generates a full counselor-facing observational wellness report for a case.

    Authorization:
    - Only verified, approved counselors may call this.
    - The counselor must be associated with the same institution as the student
      OR be the assigned counselor on the case.
    """
    # 1. Fetch the escalation case
    case = db.query(EscalationCase).filter(EscalationCase.id == case_id).first()
    if not case:
        raise NotFoundError("Escalation case not found.")

    # 2. Authorization: counselor must belong to same institution or be assigned
    counselor = db.query(Counselor).filter(Counselor.user_id == counselor_user_id).first()
    if not counselor:
        raise PermissionDeniedError("Counselor profile not found.")

    student = case.student
    if not student:
        raise NotFoundError("Student record not found for this case.")

    is_assigned = str(case.assigned_counselor_id) == str(counselor.id)
    same_institution = str(counselor.institution_id) == str(student.institution_id)

    if not (is_assigned or same_institution):
        raise PermissionDeniedError(
            "You are not authorized to access this case. "
            "Only the assigned counselor or a counselor from the same institution may view this report."
        )

    # 3. Fetch current and previous wellness check-ins (no N+1: two targeted queries)
    all_checkins = db.query(WellnessCheckin).filter(
        WellnessCheckin.student_id == student.id
    ).order_by(WellnessCheckin.created_at.desc()).limit(10).all()

    latest_checkin = all_checkins[0] if all_checkins else None
    previous_checkin = all_checkins[1] if len(all_checkins) >= 2 else None

    # 4. Current risk data: prefer stored check-in, fall back to case data
    if latest_checkin:
        wellness_score = round(latest_checkin.wellness_score, 1)
        risk_indicator = round(latest_checkin.risk_indicator, 2)
        risk_level = latest_checkin.risk_level.value
    else:
        wellness_score = round(max(0.0, 100.0 - case.risk_score), 1)
        risk_indicator = round(max(1.0, min(10.0, 1.0 + (case.risk_score / 100.0) * 9.0)), 2)
        risk_level = case.risk_level.value

    # 5. Previous risk indicator (no fabrication)
    previous_risk_indicator: Optional[float] = None
    risk_change: Optional[float] = None
    if previous_checkin:
        previous_risk_indicator = round(previous_checkin.risk_indicator, 2)
        risk_change = round(risk_indicator - previous_risk_indicator, 2)

    # 6. Longitudinal baseline and behavioral changes via existing BehaviorService
    baseline = compute_baseline(db, student.id, window_days=14)
    behavioral_changes: Dict[str, Any] = {}
    trend = "STABLE"
    sudden_change = False

    if latest_checkin:
        current_metrics = {
            "mood_score": latest_checkin.mood_score,
            "stress_score": latest_checkin.stress_score,
            "energy_score": latest_checkin.energy_score,
            "sleep_hours": latest_checkin.sleep_hours,
            "wellness_score": latest_checkin.wellness_score,
        }
        beh_result = detect_behavioral_changes(baseline, current_metrics)
        behavioral_changes = beh_result.get("changes", {})
        trend = beh_result.get("trend", "STABLE")
        sudden_change = beh_result.get("sudden_change", False)

    # 7. Risk factor decomposition from stored EscalationCase.factors_json
    # Do NOT recalculate risk. Explain what was already computed.
    stored_factors: Dict[str, Any] = case.factors_json or {}
    risk_factors: List[Dict[str, Any]] = []
    for key, label in FACTOR_LABELS.items():
        contribution = stored_factors.get(key, 0)
        if contribution and contribution > 0:
            risk_factors.append({
                "factor": key,
                "label": label,
                "contribution": contribution
            })
    # Sort by contribution descending
    risk_factors.sort(key=lambda x: x["contribution"], reverse=True)

    # 8. Conversation themes — extract from recent companion messages (student messages only)
    # PRIVACY: we only analyze student-authored messages, do not return raw content
    conversation_themes: List[str] = []
    try:
        latest_conv = db.query(CompanionConversation).filter(
            CompanionConversation.student_id == student.id
        ).order_by(CompanionConversation.updated_at.desc()).first()

        if latest_conv:
            # Only fetch recent student-authored messages (limit 20 to avoid N+1)
            student_messages = db.query(CompanionMessage).filter(
                CompanionMessage.conversation_id == latest_conv.id,
                CompanionMessage.role == MessageRole.STUDENT
            ).order_by(CompanionMessage.created_at.desc()).limit(20).all()

            if student_messages:
                msg_dicts = [{"role": "student", "content": m.content} for m in student_messages]
                obs = extract_structured_wellness_observations(msg_dicts)
                raw_themes: List[str] = obs.get("themes", [])
                conversation_themes = [
                    THEME_LABELS.get(t, t.replace("_", " ").title())
                    for t in raw_themes
                ]
    except Exception:
        # Graceful degradation — themes are observational extras, not core
        conversation_themes = []

    # 9. Crisis / safety state
    factors_for_crisis = case.factors_json or {}
    crisis_indicator_value = factors_for_crisis.get("crisis_indicator", 0)
    safety_priority = case.risk_level == RiskLevel.CRITICAL or crisis_indicator_value > 0
    safety_info: Dict[str, Any] = {}
    if safety_priority:
        safety_info = {
            "safety_indicator_detected": True,
            "priority": case.risk_level.value.upper(),
            "action": "Immediate counselor review recommended."
        }

    # 10. Escalation history from case lifecycle
    escalation_history = _build_escalation_history(case)

    # 11. Observational summary (deterministic — no Gemini call)
    summary = _build_observational_summary(
        risk_level=risk_level,
        trend=trend,
        sudden_change=sudden_change,
        behavioral_changes=behavioral_changes,
        conversation_themes=conversation_themes,
        risk_indicator=risk_indicator,
        has_baseline=baseline.get("has_sufficient_data", False)
    )

    # 12. Support recommendation
    recommendation = _build_recommendation(
        risk_level=risk_level,
        sudden_change=sudden_change,
        safety_priority=safety_priority,
        trend=trend
    )

    return {
        "student_reference": student.anonymous_id,
        "risk": {
            "wellness_score": wellness_score,
            "risk_indicator": risk_indicator,
            "risk_level": risk_level.upper(),
            "previous_risk_indicator": previous_risk_indicator,
            "risk_change": risk_change,
            "trend": trend,
            "sudden_change": sudden_change,
        },
        "risk_factors": risk_factors,
        "behavioral_changes": _format_behavioral_changes(behavioral_changes),
        "conversation_themes": conversation_themes,
        "observations": _build_observation_signals(latest_checkin, behavioral_changes, sudden_change),
        "safety": safety_info if safety_priority else None,
        "observational_summary": summary,
        "recommendation": recommendation,
        "escalation_history": escalation_history,
        "case_status": case.status.value,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "disclaimer": (
            "This is an AI-generated observational wellness summary for counselor reference only. "
            "It is not a medical or psychiatric diagnosis. Counselor professional judgment is required."
        )
    }


def _build_escalation_history(case: EscalationCase) -> List[Dict[str, Any]]:
    """Build a timeline of escalation lifecycle events from case data."""
    history = []
    history.append({
        "event": "Case created",
        "detail": f"Risk level: {case.risk_level.value.upper()} | Trigger: {case.trigger_reason}",
        "timestamp": case.created_at.isoformat() if case.created_at else None
    })

    status_val = case.status.value if hasattr(case.status, "value") else str(case.status)
    if status_val in ("reviewing", "contacted", "session_scheduled", "monitoring", "resolved"):
        history.append({
            "event": "Counselor review initiated",
            "detail": f"Status updated to: {status_val.replace('_', ' ').title()}",
            "timestamp": case.updated_at.isoformat() if case.updated_at else None
        })
    if case.notes:
        history.append({
            "event": "Counselor notes added",
            "detail": case.notes[:200],  # Truncate for safety
            "timestamp": case.updated_at.isoformat() if case.updated_at else None
        })
    return history


def _format_behavioral_changes(changes: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Convert behavioral changes dict to counselor-friendly list format."""
    result = []
    label_map = {
        "mood": "Mood",
        "stress": "Stress",
        "energy": "Energy",
        "sleep": "Sleep (hours)"
    }
    for metric, data in changes.items():
        if not isinstance(data, dict):
            continue
        result.append({
            "metric": metric,
            "label": label_map.get(metric, metric.title()),
            "baseline": data.get("baseline"),
            "current": data.get("current"),
            "delta": data.get("delta"),
            "direction": data.get("direction"),
            "severity": data.get("severity"),
            "concerning": data.get("concerning", False)
        })
    return result


def _build_observation_signals(
    checkin: Optional[WellnessCheckin],
    behavioral_changes: Dict[str, Any],
    sudden_change: bool
) -> List[str]:
    """
    Build a list of specific observational signal strings from check-in data.
    Only include signals with actual data; do not fabricate.
    """
    signals = []
    if not checkin:
        return ["Insufficient check-in data available for observational analysis."]

    if checkin.mood_score <= 3:
        signals.append(f"Reported mood score of {checkin.mood_score}/10 — significantly below typical range.")
    elif checkin.mood_score <= 5:
        signals.append(f"Reported mood score of {checkin.mood_score}/10 — below typical range.")

    if checkin.stress_score >= 8:
        signals.append(f"Reported stress score of {checkin.stress_score}/10 — significantly elevated.")
    elif checkin.stress_score >= 6:
        signals.append(f"Reported stress score of {checkin.stress_score}/10 — above typical range.")

    if checkin.sleep_hours < 5.0:
        signals.append(f"Reported sleep of {checkin.sleep_hours}h — significantly below recommended range.")
    elif checkin.sleep_hours < 6.5:
        signals.append(f"Reported sleep of {checkin.sleep_hours}h — below recommended range.")

    if checkin.energy_score <= 3:
        signals.append(f"Reported energy level of {checkin.energy_score}/10 — markedly reduced.")

    if checkin.academic_stress >= 8:
        signals.append(f"Reported academic stress of {checkin.academic_stress}/10 — significantly elevated.")

    mood_change = behavioral_changes.get("mood", {})
    if mood_change.get("severity") == "significant" and mood_change.get("direction") == "declining":
        signals.append(
            f"Mood observed declining {abs(mood_change.get('delta', 0)):.1f} points from recent baseline."
        )

    sleep_change = behavioral_changes.get("sleep", {})
    if sleep_change.get("severity") == "significant" and sleep_change.get("direction") == "reduction":
        signals.append(
            f"Sleep reduced by {abs(sleep_change.get('delta', 0)):.1f}h compared to recent baseline."
        )

    if sudden_change:
        signals.append(
            "Multiple concerning indicators observed simultaneously — sudden behavioral shift pattern detected."
        )

    return signals if signals else ["Observed metrics within expected range based on available data."]


def _build_observational_summary(
    risk_level: str,
    trend: str,
    sudden_change: bool,
    behavioral_changes: Dict[str, Any],
    conversation_themes: List[str],
    risk_indicator: float,
    has_baseline: bool
) -> str:
    """
    Generates a concise, non-diagnostic observational summary deterministically.
    No Gemini call is made here.
    """
    parts = []

    # Opening
    level_phrases = {
        "low": "Current check-in data indicates overall wellness within a manageable range.",
        "moderate": "Recent check-in data suggests emerging wellness concerns that may benefit from supportive follow-up.",
        "high": "Recent check-in data indicates elevated wellness concern across multiple measured dimensions.",
        "critical": "Recent check-in data indicates significant wellness concern. Timely counselor engagement is recommended."
    }
    parts.append(level_phrases.get(risk_level.lower(), "Recent wellness data indicates potential concern."))

    # Trend
    trend_phrases = {
        "DECLINING": "Observed trends indicate a declining pattern compared with recent baseline data.",
        "IMPROVING": "Observed trends indicate improvement compared with recent baseline data.",
        "STABLE": "Observed trends appear stable relative to recent baseline data."
    }
    if has_baseline:
        parts.append(trend_phrases.get(trend, ""))

    # Sudden change
    if sudden_change:
        parts.append(
            "A concurrent shift across multiple wellness dimensions was observed, "
            "which may indicate acute or compounding stress."
        )

    # Behavioral changes
    concerning = [
        k for k, v in behavioral_changes.items()
        if isinstance(v, dict) and v.get("concerning")
    ]
    if concerning:
        labels = {"mood": "mood", "stress": "stress levels", "energy": "energy", "sleep": "sleep"}
        readable = [labels.get(c, c) for c in concerning]
        parts.append(
            f"Specifically, {', '.join(readable)} showed notable change compared with the student's recent baseline."
        )

    # Conversation themes
    if conversation_themes:
        themes_str = ", ".join([f'"{t}"' for t in conversation_themes[:3]])
        parts.append(
            f"The AI companion identified the following recurring themes in recent conversations: {themes_str}."
        )

    # Closing
    parts.append(
        f"Wellness risk indicator: {risk_indicator:.1f}/10. "
        "This summary is observational and does not constitute a clinical assessment."
    )

    return " ".join(p for p in parts if p)


def _build_recommendation(
    risk_level: str,
    sudden_change: bool,
    safety_priority: bool,
    trend: str
) -> str:
    """Generates a concise, non-diagnostic support recommendation."""
    if safety_priority:
        return "Immediate counselor review recommended. Please prioritize direct outreach to this student."
    if risk_level == "high" or sudden_change:
        return (
            "Proactive counselor outreach recommended. Consider scheduling a follow-up session "
            "to offer supportive check-in."
        )
    if risk_level == "moderate" or trend == "DECLINING":
        return (
            "Counselor follow-up recommended. A brief supportive message or offered session "
            "may be beneficial."
        )
    return "Continue monitoring. No immediate escalation indicated based on current data."
