import re
from typing import Dict, Any

# Crisis keywords & phrases requiring immediate safety workflow
# These are exact substring matches (case-insensitive)
CRISIS_TRIGGERS = [
    # Suicidal ideation - direct
    "suicidal thoughts", "suicidal thought", "thinking about suicide",
    "want to die", "wanna die", "wish i was dead", "wish i were dead",
    "kill myself", "killing myself", "end my life", "ending my life",
    "suicide", "suicidal",
    # Self-harm
    "self harm", "self-harm", "cutting myself", "hurt myself", "hurting myself",
    "harm myself", "harming myself",
    # Hopelessness & giving up
    "no reason to live", "no point living", "better off without me",
    "better off dead", "cannot go on anymore", "can't go on anymore",
    "can't take it anymore", "cannot take it anymore",
    "ending it all", "end it all", "end everything",
    "take all the pills", "overdose",
    # Other serious expressions
    "don't want to be here anymore", "don't want to exist",
    "i want to disappear forever", "want to disappear forever",
    "no point in living", "life is not worth living",
    "life isn't worth living",
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
