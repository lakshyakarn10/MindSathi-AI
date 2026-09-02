"""
Google Gemini LLM Client for MindSaathi AI Companion.

Provides:
- generate_gemini_companion_response: multi-turn conversational response generation
- extract_wellness_observations: structured observational signals extraction from chat
- Fallback heuristic generation when GEMINI_API_KEY is not configured or network request fails.
"""
from typing import List, Dict, Any, Optional
import httpx
from app.core.config import settings
from app.core.logging import logger
from app.ml.crisis_detector import detect_crisis
from app.ml.sentiment import analyze_sentiment
from app.ml.emotion import detect_emotion

COMPANION_SYSTEM_PROMPT = """You are MindSaathi, a warm, compassionate, and culturally attuned mental wellness companion for college and university students.

RESPONSE FORMAT & MODULAR STRUCTURE (STRICT):
1. Avoid Walls of Text: Never send long, unbroken paragraphs. Keep your entire response concise (under 120-150 words), scannable, and structured.
2. Structure Every Response into 3 Clear, Modular Sections:
   • Part 1 — Empathy (1-2 sentences): Acknowledge and warmly validate the student's feelings.
   • Part 2 — Actionable Steps (2-3 bullet points): Provide bite-sized, practical suggestions using bullet points ("•") with **bold action keywords** (e.g. • **Paced breathing**: Inhale for 4s, hold for 4s, exhale for 4s).
   • Part 3 — Gentle Check-in (1 short sentence): Close with a single comforting question on its own line to keep the dialogue supportive and unpressured.
3. Visual Spacing: Always use clean double line breaks between paragraphs and bullet points so the text is easy to read.
4. Non-Clinical Boundary: You are an observational supportive companion, NOT a medical doctor or psychiatrist. Never diagnose or prescribe medication.
5. Crisis Safety: If the user expresses thoughts of self-harm, suicide, severe hopelessness, or immediate danger, immediately offer deep compassionate support and emphasize calling the 24/7 national Tele-MANAS helpline toll-free at 14416 or reaching out to a campus counselor.
"""

import random
import hashlib

def generate_gemini_companion_response(
    messages: List[Dict[str, str]],
    api_key: Optional[str] = None,
    model: Optional[str] = None
) -> Dict[str, Any]:
    """
    Sends multi-turn chat messages to Google Gemini API.
    Falls back gracefully to intelligent heuristic responses if API key is not configured or API call fails.
    """
    key = api_key or settings.GEMINI_API_KEY
    selected_model = model or getattr(settings, "GEMINI_MODEL", "gemini-2.5-flash")

    # Always check the LAST USER message for crisis — not the last message which may be an AI reply
    latest_message = ""
    for msg in reversed(messages):
        if msg.get("role") in ["user", "student"]:
            latest_message = msg.get("content", "")
            break
    if not latest_message:
        latest_message = messages[-1]["content"] if messages else ""

    crisis_res = detect_crisis(latest_message)
    is_crisis = crisis_res.get("crisis_indicator", False)

    if is_crisis:
        return {
            "response": (
                "I hear how much pain you are carrying right now, and I want you to know that you are not alone. "
                "Please reach out for immediate support—our campus counseling team is here for you, and the national "
                "Tele-MANAS helpline is available 24/7 toll-free at 14416. You matter, and there is help available right now."
            ),
            "suggested_topics": ["Connect with Counselor", "Emergency Helpline (Tele-MANAS 14416)"],
            "recommended_exercise": {
                "title": "Grounding Reset",
                "duration": "2 minutes",
                "description": "Slow, steady sensory awareness."
            },
            "should_offer_counselor": True,
            "crisis_detected": True,
            "model_used": "safety-rule-engine",
            "is_fallback": False
        }

    # If Gemini API key is configured, call Gemini REST API
    if key:
        models_to_try = [selected_model]
        for fallback_m in ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-flash-lite-latest", "gemini-flash-latest"]:
            if fallback_m not in models_to_try:
                models_to_try.append(fallback_m)

        # Normalize and prepare multi-turn conversation for Gemini API
        raw_contents = []
        for msg in messages:
            content_str = (msg.get("content") or "").strip()
            if not content_str:
                continue
            role = "user" if msg.get("role") in ["student", "user"] else "model"
            raw_contents.append({"role": role, "text": content_str})

        # Merge consecutive turns with the same role and ensure alternation
        merged_turns = []
        for turn in raw_contents:
            if merged_turns and merged_turns[-1]["role"] == turn["role"]:
                merged_turns[-1]["text"] += "\n" + turn["text"]
            else:
                merged_turns.append({"role": turn["role"], "text": turn["text"]})

        # Ensure first turn is user (Gemini requires it)
        if merged_turns and merged_turns[0]["role"] == "model":
            merged_turns.insert(0, {"role": "user", "text": "Hello"})

        # Ensure last turn is user (Gemini rejects requests ending with model turn)
        if merged_turns and merged_turns[-1]["role"] == "model":
            merged_turns.append({"role": "user", "text": latest_message or "Please continue."})

        gemini_contents = [
            {"role": t["role"], "parts": [{"text": t["text"]}]}
            for t in merged_turns
        ]

        if not gemini_contents and latest_message:
            gemini_contents = [{"role": "user", "parts": [{"text": latest_message}]}]

        payload = {
            "systemInstruction": {
                "parts": [{"text": COMPANION_SYSTEM_PROMPT}]
            },
            "contents": gemini_contents,
            "generationConfig": {
                "temperature": 0.7,
                "topP": 0.9,
                "maxOutputTokens": 600,
                "thinkingConfig": {
                    "thinkingBudget": 0
                }
            }
        }

        for m_name in models_to_try:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{m_name}:generateContent?key={key}"
                with httpx.Client(timeout=15.0) as client:
                    resp = client.post(url, json=payload)
                    # If model doesn't support thinkingConfig (400), retry without thinkingConfig
                    if resp.status_code == 400:
                        clean_payload = {
                            "systemInstruction": payload["systemInstruction"],
                            "contents": payload["contents"],
                            "generationConfig": {
                                "temperature": 0.7,
                                "topP": 0.9,
                                "maxOutputTokens": 600
                            }
                        }
                        resp = client.post(url, json=clean_payload)

                    if resp.status_code == 200:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            content_parts = candidates[0].get("content", {}).get("parts", [])
                            if content_parts:
                                ai_text = content_parts[0].get("text", "")
                                if ai_text.strip():
                                    suggested, rec_exercise = _generate_suggestions_and_exercise(latest_message)
                                    return {
                                        "response": ai_text.strip(),
                                        "suggested_topics": suggested,
                                        "recommended_exercise": rec_exercise,
                                        "should_offer_counselor": False,
                                        "crisis_detected": False,
                                        "model_used": m_name,
                                        "is_fallback": False
                                    }
                    else:
                        logger.error(f"Gemini API ({m_name}) returned non-200 status {resp.status_code}: {resp.text[:300]}")
            except Exception as e:
                logger.error(f"Gemini API ({m_name}) call failed with exception: {e}")

        logger.error("All Gemini models failed. Falling back to heuristic response. Check GEMINI_API_KEY and model availability.")

    # Fallback heuristic response generator
    return _generate_heuristic_companion_reply(latest_message)


def extract_structured_wellness_observations(messages: List[Dict[str, str]]) -> Dict[str, Any]:
    """
    Extracts structured psychological and wellness themes, sentiment, and risk signals
    from a sequence of conversation turns.
    """
    if not messages:
        return {
            "sentiment_score": 0.0,
            "emotion": "calm",
            "themes": [],
            "distress_signals_count": 0,
            "conversational_risk_factor": 0.0,
            "crisis_flag": False
        }

    combined_text = " ".join([m["content"] for m in messages if m.get("role") in ["student", "user"]])
    sentiment = analyze_sentiment(combined_text)
    emotion = detect_emotion(combined_text, mood_score=6, stress_score=5)
    crisis_res = detect_crisis(combined_text)

    themes = []
    distress_count = 0
    lower = combined_text.lower()

    if any(k in lower for k in ["exam", "assignment", "grade", "fail", "study", "cgpa", "deadline", "project", "homework", "quiz"]):
        themes.append("academic_pressure")
        distress_count += 1
    if any(k in lower for k in ["sleep", "tired", "insomnia", "exhausted", "nightmare", "restless", "fatigue"]):
        themes.append("sleep_deprivation")
        distress_count += 1
    if any(k in lower for k in ["lonely", "alone", "isolated", "no friends", "homesick", "friend", "roommate"]):
        themes.append("social_isolation")
        distress_count += 1
    if any(k in lower for k in ["panic", "anxious", "anxiety", "scared", "nervous", "shaking", "heart racing", "overwhelmed"]):
        themes.append("anxiety_arousal")
        distress_count += 1
    if any(k in lower for k in ["hopeless", "worthless", "give up", "pointless", "numb", "crying", "depressed"]):
        themes.append("burnout_hopelessness")
        distress_count += 2

    # Compute conversational risk contribution (0.0 to 100.0)
    risk_factor = 0.0
    if crisis_res["crisis_indicator"]:
        risk_factor = 100.0
    elif distress_count >= 3 or sentiment <= -0.5:
        risk_factor = min(85.0, 30.0 + (distress_count * 15.0))
    elif distress_count >= 1 or sentiment < 0.0:
        risk_factor = min(50.0, 15.0 + (distress_count * 12.0))

    return {
        "sentiment_score": sentiment,
        "emotion": emotion,
        "themes": themes,
        "distress_signals_count": distress_count,
        "conversational_risk_factor": risk_factor,
        "crisis_flag": crisis_res["crisis_indicator"]
    }


def _generate_suggestions_and_exercise(message: str) -> tuple:
    lower = message.lower()
    if any(k in lower for k in ["exam", "assignment", "deadline", "workload", "study", "failing", "project", "test"]):
        suggested = ["Break down workload", "Try 25-min Pomodoro", "Schedule counselor chat", "Take a short break"]
        rec = {
            "title": "Workload Breakdown",
            "duration": "5 minutes",
            "description": "Organize pending tasks into small, progressive focus windows."
        }
    elif any(k in lower for k in ["sleep", "tired", "insomnia", "exhausted", "night", "fatigue"]):
        suggested = ["Sleep reset exercise", "Breathing for sleep", "Screen-free wind-down"]
        rec = {
            "title": "Sleep Reset Wind-Down",
            "duration": "8 minutes",
            "description": "Progressive relaxation to ease tension before bedtime."
        }
    elif any(k in lower for k in ["panic", "anxious", "anxiety", "scared", "nervous", "worry", "fear"]):
        suggested = ["Start box breathing", "5-4-3-2-1 Grounding", "Talk about my worries"]
        rec = {
            "title": "Box Breathing",
            "duration": "2 minutes",
            "description": "Four-count breath pacing to stabilize acute stress."
        }
    elif any(k in lower for k in ["sad", "lonely", "alone", "down", "cry", "depressed", "homesick"]):
        suggested = ["Connect with a friend", "Journal reflection", "Campus wellness support"]
        rec = {
            "title": "Self-Compassion Check-In",
            "duration": "3 minutes",
            "description": "Gentle validation and comforting self-talk for tough moments."
        }
    elif any(k in lower for k in ["hi", "hello", "hey", "who are you", "what can you do"]):
        suggested = ["Talk about today's stress", "Guided breathing", "Organize my thoughts", "Check in on my mood"]
        rec = {
            "title": "Mindful Moment",
            "duration": "2 minutes",
            "description": "A quick pause to ground yourself and check in with your feelings."
        }
    else:
        suggested = ["Try a calming exercise", "Reflect in my journal", "Talk about what's stressing me"]
        rec = {
            "title": "Thought Reframing",
            "duration": "5 minutes",
            "description": "Gentle perspective shifts for recurring worries."
        }
    return suggested, rec


def _generate_heuristic_companion_reply(user_message: str) -> Dict[str, Any]:
    lower = user_message.lower()
    suggested, rec = _generate_suggestions_and_exercise(user_message)

    # Safety net: re-check crisis even in fallback path to prevent casual responses
    crisis_res = detect_crisis(user_message)
    if crisis_res.get("crisis_indicator", False):
        return {
            "response": (
                "I hear how much pain you are carrying right now, and I want you to know that you are not alone. "
                "Please reach out for immediate support—our campus counseling team is here for you, and the national "
                "Tele-MANAS helpline is available 24/7 toll-free at 14416. You matter, and there is help available right now."
            ),
            "suggested_topics": ["Connect with Counselor", "Emergency Helpline (Tele-MANAS 14416)"],
            "recommended_exercise": {
                "title": "Grounding Reset",
                "duration": "2 minutes",
                "description": "Slow, steady sensory awareness."
            },
            "should_offer_counselor": True,
            "crisis_detected": True,
            "model_used": "safety-rule-engine",
            "is_fallback": False
        }
    
    # Hash for deterministic yet varied selection based on message length and content
    # Mix message hash with random entropy so the same input doesn't always
    # produce the same response index (fixes always-identical reply bug).
    seed = int(hashlib.md5(user_message.encode()).hexdigest(), 16) + random.randint(0, 10000)

    if any(k in lower for k in ["exam", "assignment", "deadline", "workload", "study", "failing", "test", "cgpa"]):
        academic_responses = [
            "Academic demands can feel overwhelming when several deadlines arrive at once. "
            "Breaking your syllabus or tasks into 25-minute focus intervals with brief breaks can help restore clarity. "
            "What is the single most urgent task on your plate right now?",
            "It is completely natural to feel pressure around exams and grades. Remember that your worth is not defined "
            "by a single score. Taking things one topic or chapter at a time will give you momentum. How can we make your next hour manageable?",
            "When study fatigue kicks in, pushing through without rest often increases stress. Even a 5-minute stretch or hydration pause "
            "can reset your cognitive focus. Would you like to map out your next manageable step together?"
        ]
        response_text = academic_responses[seed % len(academic_responses)]

    elif any(k in lower for k in ["sleep", "tired", "insomnia", "exhausted", "night", "fatigue", "drowsy"]):
        sleep_responses = [
            "Sleep directly impacts your emotional well-being and concentration. Putting screens away 20 minutes before bed "
            "and doing slow abdominal breathing can signal calm to your nervous system. Would you like to try a sleep reset exercise?",
            "Carrying physical or mental exhaustion throughout the day is tough. Be gentle with yourself today, prioritize rest, "
            "and consider jotting down any racing thoughts in your journal so your mind can let them go before bedtime.",
            "Rest is just as productive as work. If nighttime worry keeps you awake, try focusing gently on the natural rhythm of your breath. "
            "Would you like some tips for building a soothing nighttime routine?"
        ]
        response_text = sleep_responses[seed % len(sleep_responses)]

    elif any(k in lower for k in ["panic", "anxious", "anxiety", "scared", "nervous", "shaking", "racing"]):
        anxiety_responses = [
            "Let's take a slow, gentle breath together. Inhale through your nose for 4 counts, hold gently for 4, "
            "and release through your mouth for 4. You are in a safe space, and you don't have to carry this all at once.",
            "When anxiety peaks, your body is trying to protect you, even if there's no immediate danger. "
            "Notice 5 things you can see around you right now and feel your feet firmly on the floor. Take your time.",
            "I hear how intense things feel right now. Remember that feelings of anxiety are temporary waves—they rise, but they also subside. "
            "Let's focus on just this moment. How does your breathing feel right now?"
        ]
        response_text = anxiety_responses[seed % len(anxiety_responses)]

    elif any(k in lower for k in ["sad", "lonely", "alone", "down", "cry", "depressed", "homesick", "hurt"]):
        sadness_responses = [
            "I hear how heavy things feel for you right now, and I appreciate you sharing that with me. "
            "It is completely valid to have days where everything feels overwhelming. You don't have to go through this alone.",
            "Loneliness and sadness can feel isolating, especially in a busy campus environment. Please remember that what you're feeling is real, "
            "and taking small pauses to care for yourself is important. What usually brings you even a small sense of comfort?",
            "Thank you for being open. It takes courage to acknowledge difficult emotions. If you'd like, you can tell me more about what's "
            "weighing on your heart, or we can simply sit with a calming exercise together."
        ]
        response_text = sadness_responses[seed % len(sadness_responses)]

    elif any(k in lower for k in ["hi", "hello", "hey", "good morning", "good evening", "who are you", "how are you"]):
        greeting_responses = [
            "Hello! I am MindSaathi, your dedicated student wellness companion. I'm here to listen, offer supportive coping tools, "
            "or simply provide a calm space to unpack your thoughts. How is your day going so far?",
            "Hi there! Welcome back to MindSaathi. Whether you're navigating academic stress, looking for a quick breathing reset, "
            "or just want to reflect, I'm here for you. How are you feeling right now?",
            "Hello! It's great to connect with you. Take a deep breath and let me know what's on your mind today—I'm ready whenever you are."
        ]
        response_text = greeting_responses[seed % len(greeting_responses)]

    elif any(k in lower for k in ["thank", "thanks", "helpful", "good", "great", "better"]):
        positive_responses = [
            "You're very welcome! I'm really glad this space is helpful for you. Remember to celebrate the small wins and give yourself credit today.",
            "I'm happy to hear that! Taking time for your mental well-being is a wonderful habit. Is there anything else you'd like to explore today?",
            "That's wonderful to hear. Keep taking things one step at a time, and remember I'm always here whenever you need a supportive ear."
        ]
        response_text = positive_responses[seed % len(positive_responses)]

    else:
        general_responses = [
            f"Thank you for sharing that with me. It is completely valid to explore how you're feeling today. "
            "Taking things one step at a time can help make the day feel much more manageable. What aspect would you like to focus on next?",
            f"I hear you. Processing your thoughts out loud can bring clarity when things feel unstructured. "
            "Would you like to explore some practical coping strategies, try a grounding exercise, or just talk it through further?",
            f"I'm listening and here to support you. Whatever you're going through, remember you don't have to carry every worry at once. "
            "How can I best support you in this moment?"
        ]
        response_text = general_responses[seed % len(general_responses)]

    return {
        "response": response_text,
        "suggested_topics": suggested,
        "recommended_exercise": rec,
        "should_offer_counselor": False,
        "crisis_detected": False,
        "model_used": "rule-heuristic-fallback",
        "is_fallback": True
    }

