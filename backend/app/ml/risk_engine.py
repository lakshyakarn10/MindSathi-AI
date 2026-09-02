from typing import Dict, Any, List, Optional
from app.models.wellness import RiskLevel

# Base factor weights for routine check-ins (sum to 1.0)
BASE_WEIGHTS = {
    "mood": 0.25,
    "stress": 0.20,
    "sleep": 0.15,
    "journal": 0.20,
    "checkin": 0.20
}

def calculate_risk(
    mood_score: int, # 0-10 (low is higher risk)
    stress_score: int, # 0-10 (high is higher risk)
    sleep_hours: float, # hours
    sentiment_score: float, # -1.0 to 1.0
    recent_checkins_count: int,
    crisis_flag: bool = False,
    behavior_data: Optional[Dict[str, Any]] = None,
    conversation_signals: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Computes explainable multivariate risk decomposition, composite risk level,
    and normalized 1.0-10.0 Wellness Risk Indicator across behavioral and conversational signals.
    """
    if conversation_signals and conversation_signals.get("crisis_flag"):
        crisis_flag = True

    # 1. Mood factor (0 to 100): lower mood gives higher risk score
    mood_risk = max(0.0, min(100.0, (10 - mood_score) * 10))

    # 2. Stress factor (0 to 100): higher stress gives higher risk score
    stress_risk = max(0.0, min(100.0, stress_score * 10))

    # 3. Sleep factor (0 to 100): <5 hrs or >11 hrs increases risk
    if sleep_hours < 5.0:
        sleep_risk = 85.0
    elif sleep_hours < 6.5:
        sleep_risk = 50.0
    elif sleep_hours > 10.0:
        sleep_risk = 60.0
    else:
        sleep_risk = 20.0

    # 4. Journal factor (0 to 100): negative sentiment increases risk
    journal_risk = max(0.0, min(100.0, (1.0 - sentiment_score) * 50))

    # 5. Check-in pattern factor (0 to 100): fewer checkins indicates irregularity
    checkin_risk = max(10.0, min(80.0, (7 - min(recent_checkins_count, 7)) * 10 + 20))

    # Base weighted composite score (0-100)
    base_composite = (
        mood_risk * BASE_WEIGHTS["mood"] +
        stress_risk * BASE_WEIGHTS["stress"] +
        sleep_risk * BASE_WEIGHTS["sleep"] +
        journal_risk * BASE_WEIGHTS["journal"] +
        checkin_risk * BASE_WEIGHTS["checkin"]
    )

    # 6. Behavioral change penalty
    behavior_penalty = 0.0
    sudden_change = False
    trend = "STABLE"
    if behavior_data:
        sudden_change = behavior_data.get("sudden_change", False)
        trend = behavior_data.get("trend", "STABLE")
        concerning_count = behavior_data.get("concerning_factors_count", 0)
        if sudden_change:
            behavior_penalty = 18.0
        elif concerning_count >= 1:
            behavior_penalty = min(15.0, concerning_count * 6.0)
        elif trend == "IMPROVING":
            behavior_penalty = -5.0

    # 7. Conversational signals contribution
    conversation_penalty = 0.0
    if conversation_signals:
        conv_factor = float(conversation_signals.get("conversational_risk_factor", 0.0))
        conversation_penalty = (conv_factor / 100.0) * 20.0

    # 8. Crisis indicator override
    if crisis_flag:
        composite = max(85.0, base_composite + 25.0)
    else:
        composite = base_composite + behavior_penalty + conversation_penalty

    final_score = int(round(max(0.0, min(100.0, composite))))

    # Map 0-100 score to 1.0-10.0 Wellness Risk Indicator scale
    if crisis_flag:
        risk_indicator = round(max(8.5, min(10.0, 1.0 + (final_score / 100.0) * 9.0)), 2)
    else:
        risk_indicator = round(max(1.0, min(10.0, 1.0 + (final_score / 100.0) * 9.0)), 2)

    # Determine risk level
    if crisis_flag or final_score >= 80:
        level = RiskLevel.CRITICAL if crisis_flag else RiskLevel.HIGH
    elif final_score >= 60:
        level = RiskLevel.HIGH
    elif final_score >= 35:
        level = RiskLevel.MODERATE
    else:
        level = RiskLevel.LOW

    # Decomposed explainable contributions
    factors = {
        "mood": int(round(mood_risk * BASE_WEIGHTS["mood"])),
        "stress": int(round(stress_risk * BASE_WEIGHTS["stress"])),
        "sleep": int(round(sleep_risk * BASE_WEIGHTS["sleep"])),
        "journal": int(round(journal_risk * BASE_WEIGHTS["journal"])),
        "checkin": int(round(checkin_risk * BASE_WEIGHTS["checkin"])),
        "behavioral_change": int(round(max(0.0, behavior_penalty))),
        "conversation_signals": int(round(max(0.0, conversation_penalty))),
        "crisis_indicator": 25 if crisis_flag else 0
    }

    return {
        "risk_score": final_score,
        "risk_indicator": risk_indicator,
        "risk_level": level,
        "trend": trend,
        "sudden_change": sudden_change,
        "factors": factors
    }
