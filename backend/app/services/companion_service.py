from typing import Dict, Any, List
from app.ml.crisis_detector import detect_crisis
from app.ml.emotion import detect_emotion
from app.schemas.analytics import CompanionChatResponse

def generate_companion_reply(user_message: str) -> CompanionChatResponse:
    crisis_res = detect_crisis(user_message)
    is_crisis = crisis_res.get("crisis_indicator", False)

    if is_crisis:
        return CompanionChatResponse(
            response="I notice that you might be carrying something very heavy right now. Please remember that compassionate support is available immediately. You can reach the 24/7 national Tele-MANAS helpline toll-free at 14416 or connect with our campus counselors.",
            suggested_topics=["Connect with Counselor", "Emergency Resources (Tele-MANAS 14416)"],
            recommended_exercise={
                "title": "Grounding Reset",
                "duration": "2 minutes",
                "description": "Slow, steady sensory awareness."
            },
            should_offer_counselor=True,
            crisis_detected=True
        )

    lower = user_message.lower()
    if any(k in lower for k in ["exam", "assignment", "deadline", "workload", "study", "failing"]):
        response_text = "Academic demands can feel overwhelming when several tasks converge. Breaking large assignments into 25-minute focus intervals and taking brief breath pauses can help restore clarity. Would you like to map out your next manageable step?"
        suggested = ["Break down workload", "Try box breathing", "Schedule counselor chat", "Just listen"]
        rec = {
            "title": "Workload Breakdown",
            "duration": "5 minutes",
            "description": "Organize pending tasks into small, progressive focus windows."
        }
    elif any(k in lower for k in ["sleep", "tired", "insomnia", "exhausted", "night"]):
        response_text = "Sleep has a direct impact on emotional resilience. Establishing a quiet 10-minute digital wind-down routine before bed can help signal calm to your nervous system. Would you like to try a sleep reset exercise?"
        suggested = ["Sleep reset exercise", "Breathing for sleep", "Talk about fatigue"]
        rec = {
            "title": "Sleep Reset Wind-Down",
            "duration": "8 minutes",
            "description": "Progressive relaxation to ease tension before bedtime."
        }
    elif any(k in lower for k in ["panic", "anxious", "anxiety", "scared", "nervous"]):
        response_text = "Let's take a slow, gentle breath together. Inhale through your nose for 4 counts, hold gently for 4, and release through your mouth for 4. You don't have to navigate this all at once."
        suggested = ["Start box breathing", "5-4-3-2-1 Grounding", "Talk to someone"]
        rec = {
            "title": "Box Breathing",
            "duration": "2 minutes",
            "description": "Four-count breath pacing to stabilize acute stress."
        }
    else:
        response_text = "Thank you for sharing that. It's completely valid to notice how you're feeling today. Taking things one step at a time can help make the day feel more manageable."
        suggested = ["Try a calming exercise", "Reflect in my journal", "Talk about what's stressing me"]
        rec = {
            "title": "Thought Reframing",
            "duration": "5 minutes",
            "description": "Gentle perspective shifts for recurring worries."
        }

    return CompanionChatResponse(
        response=response_text,
        suggested_topics=suggested,
        recommended_exercise=rec,
        should_offer_counselor=False,
        crisis_detected=False
    )
