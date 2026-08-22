from app.ml.sentiment import analyze_sentiment
from app.ml.emotion import detect_emotion
from app.ml.crisis_detector import detect_crisis
from app.ml.risk_engine import calculate_risk

def test_sentiment_analysis():
    pos = analyze_sentiment("I had a great restful day and feeling calm.")
    neg = analyze_sentiment("I feel hopeless, exhausted and overwhelmed with panic.")
    assert pos > 0.3
    assert neg < -0.3

def test_emotion_detection():
    em1 = detect_emotion("So much exam stress and deadline pressure", stress_score=8)
    em2 = detect_emotion("Tired and sleepless", mood_score=4)
    assert em1 in ["overwhelmed", "anxious"]
    assert em2 in ["fatigued", "distressed"]

def test_crisis_detector():
    normal = detect_crisis("I have a difficult exam tomorrow.")
    crisis = detect_crisis("I want to end my life, cannot go on anymore.")
    assert normal["crisis_indicator"] is False
    assert crisis["crisis_indicator"] is True
    assert crisis["severity"] == "high"

def test_risk_factor_decomposition():
    risk_info = calculate_risk(
        mood_score=3,
        stress_score=9,
        sleep_hours=4.5,
        sentiment_score=-0.6,
        recent_checkins_count=2,
        crisis_flag=False
    )
    assert risk_info["risk_score"] >= 60
    assert risk_info["risk_level"].value in ["high", "critical"]
    assert "factors" in risk_info
    assert risk_info["factors"]["mood"] > 0
    assert risk_info["factors"]["stress"] > 0
