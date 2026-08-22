from typing import Optional, Tuple
from app.core.config import settings

def check_aggregate_privacy(cohort_size: int, threshold: int = settings.MIN_COHORT_PRIVACY_THRESHOLD) -> Tuple[bool, Optional[str]]:
    """
    Enforces k-anonymity (default k >= 15) before returning any aggregate group metrics to administrators.
    Returns (is_visible, privacy_note).
    """
    if cohort_size < threshold:
        return False, f"Data hidden to protect student privacy (cohort size {cohort_size} < threshold {threshold})."
    return True, None
