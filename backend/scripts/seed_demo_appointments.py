import os
import sys
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal, engine, Base
from app.models.appointment import Appointment, AppointmentStatus, SessionMode
from app.models.session import SessionRecord
from app.models.student import Student
from app.models.counselor import Counselor
from app.models.user import User, UserRole

def seed_appointments():
    print("[INFO] Seeding comprehensive appointments & session histories...")
    db = SessionLocal()
    try:
        counselors = db.query(Counselor).all()
        students = db.query(Student).all()

        if not counselors or not students:
            print("[ERROR] Counselors or Students missing in DB. Run seed.py first.")
            return

        counselor = counselors[0]
        now = datetime.now(timezone.utc)

        sample_appointments = [
            # 1. Video Sessions
            {
                "anon_id": "STU-2048",
                "mode": SessionMode.VIDEO,
                "reason": "Midterm stress and exam anxiety",
                "status": AppointmentStatus.CONFIRMED,
                "meet_url": "https://meet.google.com/abc-defg-hij",
                "days_offset": 1,
                "hour": 10,
                "duration": 45,
            },
            {
                "anon_id": "STU-7104",
                "mode": SessionMode.VIDEO,
                "reason": "Academic Workload & Pacing",
                "status": AppointmentStatus.CONFIRMED,
                "meet_url": "https://meet.google.com/xyz-uvwx-rst",
                "days_offset": 2,
                "hour": 11,
                "duration": 45,
            },
            {
                "anon_id": "STU-9612",
                "mode": SessionMode.VIDEO,
                "reason": "Thesis Submission & Stress Relief",
                "status": AppointmentStatus.CONFIRMED,
                "meet_url": "https://meet.google.com/efg-hijk-lmn",
                "days_offset": 3,
                "hour": 15,
                "duration": 45,
            },

            # 2. In-Person Sessions
            {
                "anon_id": "STU-2048",
                "mode": SessionMode.IN_PERSON,
                "reason": "Academic stress & Midterm support",
                "status": AppointmentStatus.CONFIRMED,
                "location": "Student Wellness Center, Room 204",
                "days_offset": 1,
                "hour": 14,
                "duration": 45,
            },
            {
                "anon_id": "STU-4402",
                "mode": SessionMode.IN_PERSON,
                "reason": "In-Person Consultation & Risk Review",
                "status": AppointmentStatus.CONFIRMED,
                "location": "Counseling Center Suite 102",
                "days_offset": 2,
                "hour": 16,
                "duration": 45,
            },
            {
                "anon_id": "STU-8821",
                "mode": SessionMode.IN_PERSON,
                "reason": "Placement Interview Prep & Grounding",
                "status": AppointmentStatus.CONFIRMED,
                "location": "Student Activity Block, Room 305",
                "days_offset": 4,
                "hour": 11,
                "duration": 45,
            },

            # 3. Chat Sessions
            {
                "anon_id": "STU-1932",
                "mode": SessionMode.CHAT,
                "reason": "Sleep Hygiene & Relaxation Chat",
                "status": AppointmentStatus.CONFIRMED,
                "days_offset": 0,
                "hour": 17,
                "duration": 30,
            },
            {
                "anon_id": "STU-3120",
                "mode": SessionMode.CHAT,
                "reason": "Interpersonal & Roommate Decompression",
                "status": AppointmentStatus.CONFIRMED,
                "days_offset": 2,
                "hour": 14,
                "duration": 45,
            },

            # 4. Completed Sessions (with SessionRecord summaries)
            {
                "anon_id": "STU-2048",
                "mode": SessionMode.VIDEO,
                "reason": "Initial Academic Stress Decompression",
                "status": AppointmentStatus.COMPLETED,
                "meet_url": "https://meet.google.com/abc-defg-hij",
                "days_offset": -3,
                "hour": 11,
                "duration": 45,
                "session_record": {
                    "discussion_topics": "Academic workload, exam preparation timeline, sleep routine disruptions.",
                    "summary": "Student reported feeling overwhelmed by concurrent project deadlines. Counselor guided Pomodoro pacing and stress breakdown.",
                    "recommendations": "Continue daily check-ins, practice box breathing 2x daily, review in 1 week.",
                    "follow_up_required": True,
                    "next_follow_up_date": now + timedelta(days=7),
                }
            },
            {
                "anon_id": "STU-1932",
                "mode": SessionMode.IN_PERSON,
                "reason": "Sleep Routine & Relaxation Reset",
                "status": AppointmentStatus.COMPLETED,
                "location": "Student Wellness Center, Room 204",
                "days_offset": -5,
                "hour": 15,
                "duration": 45,
                "session_record": {
                    "discussion_topics": "Late-night screen usage, sleep latency, exam racing thoughts.",
                    "summary": "Reviewed sleep hygiene strategies. Student practiced 5-4-3-2-1 grounding exercise during session.",
                    "recommendations": "30-minute screen-free wind-down before bed, complete daily sleep check-ins.",
                    "follow_up_required": True,
                    "next_follow_up_date": now + timedelta(days=5),
                }
            },
            {
                "anon_id": "STU-1320",
                "mode": SessionMode.VIDEO,
                "reason": "Burnout Recovery & Resilience Planning",
                "status": AppointmentStatus.COMPLETED,
                "meet_url": "https://meet.google.com/xyz-uvwx-rst",
                "days_offset": -8,
                "hour": 14,
                "duration": 50,
                "session_record": {
                    "discussion_topics": "4th session of burnout recovery protocol. Student demonstrated healthy baseline restoration.",
                    "summary": "Positive response to self-guided mindfulness exercises and peer support re-engagement.",
                    "recommendations": "Continue self-guided mindfulness exercises, maintain weekly wellness check-ins.",
                    "follow_up_required": False,
                    "next_follow_up_date": now + timedelta(days=14),
                }
            },
            {
                "anon_id": "STU-7456",
                "mode": SessionMode.IN_PERSON,
                "reason": "Social Anxiety & Group Presentation Prep",
                "status": AppointmentStatus.COMPLETED,
                "location": "Wellness Center Suite 102",
                "days_offset": -12,
                "hour": 10,
                "duration": 40,
                "session_record": {
                    "discussion_topics": "Graded exposure debrief post departmental seminar presentation.",
                    "summary": "Student successfully presented in CSE departmental seminar with manageable anxiety levels.",
                    "recommendations": "Maintain confidence journal, participate in student wellness peer circles.",
                    "follow_up_required": False,
                    "next_follow_up_date": now + timedelta(days=10),
                }
            },
        ]

        created_count = 0
        for data in sample_appointments:
            # Find or match student by anon_id
            stud = db.query(Student).filter(Student.anonymous_id == data["anon_id"]).first()
            if not stud:
                stud = students[created_count % len(students)]

            start_dt = now + timedelta(days=data["days_offset"])
            start_dt = start_dt.replace(hour=data["hour"], minute=0, second=0, microsecond=0)
            end_dt = start_dt + timedelta(minutes=data["duration"])

            # Check if matching appointment already exists
            existing = db.query(Appointment).filter(
                Appointment.student_id == stud.id,
                Appointment.reason == data["reason"]
            ).first()

            if not existing:
                apt = Appointment(
                    student_id=stud.id,
                    counselor_id=counselor.id,
                    session_type="counseling",
                    mode=data["mode"],
                    reason=data["reason"],
                    scheduled_start=start_dt,
                    scheduled_end=end_dt,
                    duration_minutes=data["duration"],
                    status=data["status"],
                    meet_url=data.get("meet_url"),
                    location=data.get("location"),
                )
                db.add(apt)
                db.flush()

                if "session_record" in data:
                    sr_data = data["session_record"]
                    sr = SessionRecord(
                        appointment_id=apt.id,
                        discussion_topics=sr_data["discussion_topics"],
                        summary=sr_data["summary"],
                        recommendations=sr_data["recommendations"],
                        follow_up_required=sr_data["follow_up_required"],
                        next_follow_up_date=sr_data.get("next_follow_up_date"),
                    )
                    db.add(sr)

                created_count += 1

        db.commit()
        print(f"[SUCCESS] Seeded {created_count} comprehensive appointments & session records!")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Appointment seeding failed: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_appointments()
