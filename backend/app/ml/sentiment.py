import re

# Rule-based sentiment lexicons with normalized scoring
POSITIVE_WORDS = {
    "great", "good", "calm", "steady", "peaceful", "happy", "relaxed", "light",
    "manageable", "better", "improving", "refreshed", "energized", "hopeful",
    "confident", "grateful", "rested", "stable", "supported", "productive"
}

NEGATIVE_WORDS = {
    "stressed", "low", "bad", "terrible", "overwhelmed", "anxious", "panic", "tired",
    "exhausted", "hopeless", "sad", "depressed", "hurried", "pressure", "difficult",
    "worried", "failing", "alone", "isolated", "burnout", "struggling"
}

def analyze_sentiment(text: str) -> float:
    """
    Analyzes emotional sentiment polarity from -1.0 (most negative) to +1.0 (most positive).
    Returns 0.0 if empty or neutral.
    """
    if not text:
        return 0.0

    words = re.findall(r'\b\w+\b', text.lower())
    if not words:
        return 0.0

    pos_count = sum(1 for w in words if w in POSITIVE_WORDS)
    neg_count = sum(1 for w in words if w in NEGATIVE_WORDS)

    total_matched = pos_count + neg_count
    if total_matched == 0:
        return 0.0

    score = (pos_count - neg_count) / max(total_matched, 1)
    return max(-1.0, min(1.0, score))
