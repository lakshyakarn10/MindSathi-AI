import os
import sys
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal, engine
from app.models.message import Conversation, Message
from app.models.student import Student
from app.models.counselor import Counselor
from app.models.user import User

def seed_messages():
    print("[INFO] Seeding sample counselor-student message channels...")
    db = SessionLocal()
    try:
        counselors = db.query(Counselor).all()
        students = db.query(Student).all()

        if not counselors or not students:
            print("[ERROR] Counselors or Students missing in DB.")
            return

        counselor = counselors[0]
        counselor_user_id = counselor.user_id
        now = datetime.now(timezone.utc)

        sample_channels = [
            {
                "anon_id": "STU-2048",
                "messages": [
                    {"role": "student", "text": "Hello Dr. Sharma, I wanted to follow up about my midterm schedule.", "mins_ago": 120},
                    {"role": "counselor", "text": "Hello STU-2048. I'm glad you reached out. How are you feeling after our last discussion?", "mins_ago": 105},
                    {"role": "student", "text": "A bit better after practicing the 4-4-4-4 box breathing, but lab submissions are still piling up.", "mins_ago": 90},
                    {"role": "counselor", "text": "That's completely natural. Remember to break your study sessions into 25-minute focus blocks. We have our next session scheduled soon.", "mins_ago": 45},
                    {"role": "student", "text": "Thank you Dr. Sharma, I will try that today!", "mins_ago": 15},
                ]
            },
            {
                "anon_id": "STU-1932",
                "messages": [
                    {"role": "student", "text": "Hi Dr. Sharma, quick question about the grounding technique.", "mins_ago": 360},
                    {"role": "counselor", "text": "Hello STU-1932! Of course, what would you like to ask?", "mins_ago": 330},
                    {"role": "student", "text": "Should I do the 5-4-3-2-1 exercise before bed or whenever anxiety spikes during study?", "mins_ago": 280},
                    {"role": "counselor", "text": "Both work well! Right before bed helps quiet racing thoughts, and during study breaks it resets sensory overload.", "mins_ago": 200},
                    {"role": "student", "text": "That makes a lot of sense. Thank you!", "mins_ago": 150},
                ]
            },
            {
                "anon_id": "STU-7104",
                "messages": [
                    {"role": "student", "text": "Good morning. I've been feeling extremely exhausted lately.", "mins_ago": 720},
                    {"role": "counselor", "text": "Good morning. Thank you for sharing. Have you noticed how many hours of sleep you've been getting?", "mins_ago": 680},
                    {"role": "student", "text": "Barely 4 hours a night due to exam prep.", "mins_ago": 600},
                    {"role": "counselor", "text": "Sleep deprivation significantly amplifies stress. Let's work together to protect a 7-hour rest window this week.", "mins_ago": 540},
                ]
            },
            {
                "anon_id": "STU-3120",
                "messages": [
                    {"role": "student", "text": "Hello, I wanted to discuss placement stress.", "mins_ago": 1440},
                    {"role": "counselor", "text": "Hello STU-3120. Placement season can bring a lot of pressure. I'm here to support you.", "mins_ago": 1380},
                    {"role": "student", "text": "Interview rounds are next week and I'm having trouble sleeping.", "mins_ago": 1200},
                    {"role": "counselor", "text": "Let's schedule a brief 30-minute session to practice interview grounding and relaxation strategies.", "mins_ago": 1100},
                ]
            },
            {
                "anon_id": "STU-4402",
                "messages": [
                    {"role": "counselor", "text": "Hello STU-4402, I noticed your recent check-in indicated elevated stress levels. How are things feeling today?", "mins_ago": 2880},
                    {"role": "student", "text": "Thank you for checking in Dr. Sharma. Lab practicals have been really overwhelming.", "mins_ago": 2700},
                    {"role": "counselor", "text": "I hear you. Remember our door is open if you'd like to drop by the wellness center or talk further.", "mins_ago": 2500},
                ]
            },
        ]

        created_convs = 0
        for channel in sample_channels:
            # Find matching student
            stud = db.query(Student).filter(Student.anonymous_id == channel["anon_id"]).first()
            if not stud:
                stud = students[created_convs % len(students)]

            # Check if conversation exists
            conv = db.query(Conversation).filter(
                Conversation.student_id == stud.id,
                Conversation.counselor_id == counselor.id
            ).first()

            if not conv:
                conv = Conversation(
                    student_id=stud.id,
                    counselor_id=counselor.id,
                    last_message=channel["messages"][-1]["text"],
                    updated_at=now - timedelta(minutes=channel["messages"][-1]["mins_ago"])
                )
                db.add(conv)
                db.flush()

            # Seed messages
            for msg_data in channel["messages"]:
                msg_time = now - timedelta(minutes=msg_data["mins_ago"])
                sender_id = counselor_user_id if msg_data["role"] == "counselor" else stud.user_id

                existing_msg = db.query(Message).filter(
                    Message.conversation_id == conv.id,
                    Message.content == msg_data["text"]
                ).first()

                if not existing_msg:
                    m = Message(
                        conversation_id=conv.id,
                        sender_id=sender_id,
                        sender_role=msg_data["role"],
                        content=msg_data["text"],
                        is_read=True,
                        created_at=msg_time
                    )
                    db.add(m)

            conv.last_message = channel["messages"][-1]["text"]
            conv.updated_at = now - timedelta(minutes=channel["messages"][-1]["mins_ago"])
            created_convs += 1

        db.commit()
        print(f"[SUCCESS] Seeded {created_convs} confidential message threads in DB!")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Message seeding failed: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_messages()
