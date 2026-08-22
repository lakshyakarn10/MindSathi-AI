import re
from typing import Dict, Any

# Crisis keywords & phrases requiring immediate safety workflow
CRISIS_TRIGGERS = [
    "want to die", "kill myself", "end my life", "suicide", "suicidal",
    "self harm", "cutting myself", "no reason to live", "better off without me",
    "cannot go on anymore", "ending it all", "take all the pills"
]

def detect_crisis(text: str) -> Dict[str, Any]:
    """
    Evaluates safety indicators for acute distress.
    Returns confidence and severity without diagnostic claims.
    """
    if not text:
        return {"crisis_indicator": False, "confidence": 0.0, "severity": "none"}

    lower_text = text.lower()
    for trigger in CRISIS_TRIGGERS:
        if trigger in lower_text:
            return {
                "crisis_indicator": True,
                "confidence": 0.95,
                "severity": "high",
                "matched_pattern": trigger
            }

    return {"crisis_indicator": False, "confidence": 0.0, "severity": "none"}
