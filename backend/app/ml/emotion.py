import re

EMOTION_PATTERNS = {
    "overwhelmed": ["overwhelmed", "too much", "cannot handle", "drowning", "buried", "deadlines", "exam stress", "pressure"],
    "anxious": ["anxious", "worry", "worried", "panic", "scared", "nervous", "shaking", "racing thoughts", "heart racing"],
    "fatigued": ["tired", "exhausted", "sleepy", "burnout", "no energy", "drained", "can't sleep", "insomnia", "sleepless"],
    "distressed": ["sad", "crying", "low", "hopeless", "hurting", "alone", "isolated", "empty", "miserable"],
    "optimistic": ["better", "hopeful", "motivated", "excited", "happy", "looking forward", "productive", "confident"],
    "calm": ["calm", "steady", "relaxed", "peaceful", "okay", "fine", "manageable", "normal", "steady"]
}

def detect_emotion(text: str, mood_score: int = 7, stress_score: int = 5) -> str:
    """
    Infers categorical emotion from textual reflections and self-reported scores.
    """
    if not text:
        if stress_score >= 8:
            return "overwhelmed" if mood_score < 5 else "anxious"
        elif mood_score <= 3:
            return "distressed"
        elif mood_score <= 5:
            return "fatigued"
        elif mood_score >= 8 and stress_score <= 4:
            return "optimistic"
        return "calm"

    lower_text = text.lower()
    for emotion, keywords in EMOTION_PATTERNS.items():
        if any(k in lower_text for k in keywords):
            return emotion

    if stress_score >= 7:
        return "anxious"
    elif mood_score <= 4:
        return "distressed"
    return "calm"
