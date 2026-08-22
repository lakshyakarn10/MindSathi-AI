from typing import Dict, Any, List
from app.models.wellness import RiskLevel

# Configurable weights for explainable AI factor decomposition
WEIGHTS = {
    "mood": 0.21,
    "stress": 0.17,
    "sleep": 0.12,
    "journal": 0.18,
    "checkin": 0.14,
    "crisis": 0.18
}

def calculate_risk(
    mood_score: int, # 0-10 (low is higher risk)
    stress_score: int, # 0-10 (high is higher risk)
    sleep_hours: float, # hours
    sentiment_score: float, # -1.0 to 1.0
    recent_checkins_count: int,
    crisis_flag: bool = False
) -> Dict[str, Any]:
    """
    Computes explainable multivariate risk decomposition and composite risk level.
    """
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

    # 6. Crisis indicator factor
    crisis_risk = 100.0 if crisis_flag else 0.0

    # Weighted composite score (0-100)
    composite = (
        mood_risk * WEIGHTS["mood"] +
        stress_risk * WEIGHTS["stress"] +
        sleep_risk * WEIGHTS["sleep"] +
        journal_risk * WEIGHTS["journal"] +
        checkin_risk * WEIGHTS["checkin"] +
        crisis_risk * WEIGHTS["crisis"]
    )
    final_score = int(round(composite))

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
        "mood": int(round(mood_risk * WEIGHTS["mood"])),
        "stress": int(round(stress_risk * WEIGHTS["stress"])),
        "sleep": int(round(sleep_risk * WEIGHTS["sleep"])),
        "journal": int(round(journal_risk * WEIGHTS["journal"])),
        "checkin": int(round(checkin_risk * WEIGHTS["checkin"])),
        "crisis_indicator": int(round(crisis_risk * WEIGHTS["crisis"]))
    }

    return {
        "risk_score": final_score,
        "risk_level": level,
        "factors": factors
    }
