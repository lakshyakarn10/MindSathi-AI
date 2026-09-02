"""
Longitudinal baseline and behavioral change detection service.

Provides:
- compute_baseline: computes historical averages across checkins over a sliding window
- detect_behavioral_changes: compares current checkin metrics against baseline, detects directional shift & sudden changes
"""
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.models.wellness import WellnessCheckin

# Configurable engineering thresholds for behavioral analysis
WINDOW_DAYS = 14
MIN_BASELINE_RECORDS = 2

# Sudden change delta thresholds
MOOD_DROP_THRESHOLD = 2.0
STRESS_INCREASE_THRESHOLD = 2.0
ENERGY_DROP_THRESHOLD = 2.0
SLEEP_REDUCTION_THRESHOLD = 2.0  # hours
CONCERNING_COUNT_FOR_SUDDEN = 2


def compute_baseline(db: Session, student_id: str, window_days: int = WINDOW_DAYS) -> Dict[str, Any]:
    """
    Computes arithmetic baseline averages for a student over the sliding window.
    Returns has_sufficient_data=False if fewer than MIN_BASELINE_RECORDS exist.
    """
    since_date = datetime.now(timezone.utc) - timedelta(days=window_days)

    records = db.query(WellnessCheckin).filter(
        WellnessCheckin.student_id == student_id,
        WellnessCheckin.created_at >= since_date
    ).order_by(WellnessCheckin.created_at.asc()).all()

    if len(records) < MIN_BASELINE_RECORDS:
        return {
            "has_sufficient_data": False,
            "record_count": len(records),
            "window_days": window_days,
            "averages": None
        }

    n = len(records)
    avg_mood = sum(r.mood_score for r in records) / n
    avg_stress = sum(r.stress_score for r in records) / n
    avg_energy = sum(r.energy_score for r in records) / n
    avg_sleep = sum(r.sleep_hours for r in records) / n
    avg_sleep_quality = sum(r.sleep_quality for r in records) / n
    avg_academic_stress = sum(r.academic_stress for r in records) / n
    avg_social = sum(r.social_connection for r in records) / n
    avg_wellness = sum(r.wellness_score for r in records) / n
    avg_risk_indicator = sum(r.risk_indicator for r in records) / n

    return {
        "has_sufficient_data": True,
        "record_count": n,
        "window_days": window_days,
        "averages": {
            "mood": round(avg_mood, 2),
            "stress": round(avg_stress, 2),
            "energy": round(avg_energy, 2),
            "sleep": round(avg_sleep, 2),
            "sleep_quality": round(avg_sleep_quality, 2),
            "academic_stress": round(avg_academic_stress, 2),
            "social_connection": round(avg_social, 2),
            "wellness_score": round(avg_wellness, 2),
            "risk_indicator": round(avg_risk_indicator, 2)
        }
    }


def detect_behavioral_changes(baseline: Dict[str, Any], current: Dict[str, Any]) -> Dict[str, Any]:
    """
    Compares current checkin values against historical baseline averages.
    Detects directional shifts, severity, and sudden concerning changes.
    """
    if not baseline or not baseline.get("has_sufficient_data") or not baseline.get("averages"):
        return {
            "trend": "STABLE",
            "sudden_change": False,
            "has_baseline": False,
            "changes": {},
            "summary": "Insufficient baseline data for behavioral comparison."
        }

    base = baseline["averages"]
    changes: Dict[str, Any] = {}
    concerning_flags = 0

    # 1. Mood change
    curr_mood = float(current.get("mood_score", base["mood"]))
    delta_mood = round(curr_mood - base["mood"], 2)
    if delta_mood <= -MOOD_DROP_THRESHOLD:
        direction = "declining"
        severity = "significant"
        concerning = True
        concerning_flags += 1
    elif delta_mood < 0:
        direction = "declining"
        severity = "mild"
        concerning = False
    elif delta_mood >= MOOD_DROP_THRESHOLD:
        direction = "improving"
        severity = "significant"
        concerning = False
    elif delta_mood > 0:
        direction = "improving"
        severity = "mild"
        concerning = False
    else:
        direction = "steady"
        severity = "none"
        concerning = False

    changes["mood"] = {
        "baseline": base["mood"],
        "current": curr_mood,
        "delta": delta_mood,
        "direction": direction,
        "severity": severity,
        "concerning": concerning
    }

    # 2. Stress change
    curr_stress = float(current.get("stress_score", base["stress"]))
    delta_stress = round(curr_stress - base["stress"], 2)
    if delta_stress >= STRESS_INCREASE_THRESHOLD:
        direction = "increasing"
        severity = "significant"
        concerning = True
        concerning_flags += 1
    elif delta_stress > 0:
        direction = "increasing"
        severity = "mild"
        concerning = False
    elif delta_stress <= -STRESS_INCREASE_THRESHOLD:
        direction = "decreasing"
        severity = "significant"
        concerning = False
    elif delta_stress < 0:
        direction = "decreasing"
        severity = "mild"
        concerning = False
    else:
        direction = "steady"
        severity = "none"
        concerning = False

    changes["stress"] = {
        "baseline": base["stress"],
        "current": curr_stress,
        "delta": delta_stress,
        "direction": direction,
        "severity": severity,
        "concerning": concerning
    }

    # 3. Energy change
    curr_energy = float(current.get("energy_score", base["energy"]))
    delta_energy = round(curr_energy - base["energy"], 2)
    if delta_energy <= -ENERGY_DROP_THRESHOLD:
        direction = "declining"
        severity = "significant"
        concerning = True
        concerning_flags += 1
    elif delta_energy < 0:
        direction = "declining"
        severity = "mild"
        concerning = False
    elif delta_energy >= ENERGY_DROP_THRESHOLD:
        direction = "improving"
        severity = "significant"
        concerning = False
    elif delta_energy > 0:
        direction = "improving"
        severity = "mild"
        concerning = False
    else:
        direction = "steady"
        severity = "none"
        concerning = False

    changes["energy"] = {
        "baseline": base["energy"],
        "current": curr_energy,
        "delta": delta_energy,
        "direction": direction,
        "severity": severity,
        "concerning": concerning
    }

    # 4. Sleep change
    curr_sleep = float(current.get("sleep_hours", base["sleep"]))
    delta_sleep = round(curr_sleep - base["sleep"], 2)
    if delta_sleep <= -SLEEP_REDUCTION_THRESHOLD:
        direction = "reduction"
        severity = "significant"
        concerning = True
        concerning_flags += 1
    elif delta_sleep < 0:
        direction = "reduction"
        severity = "mild"
        concerning = False
    elif delta_sleep >= SLEEP_REDUCTION_THRESHOLD:
        direction = "increase"
        severity = "significant"
        concerning = False
    elif delta_sleep > 0:
        direction = "increase"
        severity = "mild"
        concerning = False
    else:
        direction = "steady"
        severity = "none"
        concerning = False

    changes["sleep"] = {
        "baseline": base["sleep"],
        "current": curr_sleep,
        "delta": delta_sleep,
        "direction": direction,
        "severity": severity,
        "concerning": concerning
    }

    # Sudden change trigger
    sudden_change = (
        concerning_flags >= CONCERNING_COUNT_FOR_SUDDEN or
        delta_mood <= -3.0 or
        delta_stress >= 3.5
    )

    # Trend determination
    curr_wellness = float(current.get("wellness_score", base["wellness_score"]))
    wellness_delta = curr_wellness - base["wellness_score"]

    if wellness_delta >= 5.0 and delta_mood >= 0 and delta_stress <= 0:
        trend = "IMPROVING"
    elif wellness_delta <= -5.0 or concerning_flags >= 1 or sudden_change:
        trend = "DECLINING"
    else:
        trend = "STABLE"

    return {
        "trend": trend,
        "sudden_change": sudden_change,
        "has_baseline": True,
        "changes": changes,
        "concerning_factors_count": concerning_flags
    }
