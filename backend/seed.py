import sys
import os
from datetime import datetime, timedelta, timezone

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash, encrypt_journal_content
from app.models.user import User, UserRole
from app.models.institution import Institution
from app.models.student import Student
from app.models.counselor import Counselor, VerificationStatus, AvailabilityStatus
from app.models.admin import Admin, AuthorizationStatus
from app.models.wellness import WellnessCheckin, RiskLevel
from app.models.journal import JournalEntry
from app.models.risk import EscalationCase, EscalationStatus
from app.models.appointment import Appointment, AppointmentStatus, SessionMode
from app.models.session import SessionRecord
from app.models.exercise import Exercise, ExerciseCompletion
from app.models.notification import Notification, NotificationType
from app.models.consent import ConsentRecord, ConsentType
from app.models.audit import AuditLog

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def seed():
    print("[*] Initializing MindSaathi Database Seed...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Institution
        inst = db.query(Institution).filter(Institution.code == "MSU-2026").first()
        if not inst:
            inst = Institution(
                name="MindSaathi University of Technology",
                code="MSU-2026",
                country="India",
                timezone="Asia/Kolkata",
                privacy_threshold=15
            )
            db.add(inst)
            db.commit()
            db.refresh(inst)
            print("  [+] Created Institution:", inst.name)

        # 2. Exercises
        exercises_data = [
            {
                "title": "Box Breathing",
                "description": "Four-count nervous system regulation (Inhale 4s, Hold 4s, Exhale 4s, Rest 4s).",
                "category": "breathing",
                "duration_seconds": 120,
                "instructions": "Sit comfortably with your back upright. Inhale deeply through the nose for 4 counts, hold for 4, exhale through the mouth for 4, and rest for 4.",
                "recommended_for": "acute_stress"
            },
            {
                "title": "5-4-3-2-1 Grounding",
                "description": "Sensory physical awareness when thoughts feel scattered or crowded.",
                "category": "grounding",
                "duration_seconds": 300,
                "instructions": "Notice 5 things you can see, 4 things you can physically feel, 3 things you can hear, 2 things you can smell, and 1 thing you can taste.",
                "recommended_for": "panic_anxiety"
            },
            {
                "title": "Thought Reframing",
                "description": "Examine automatic anxious thoughts and establish constructive alternatives.",
                "category": "cognitive",
                "duration_seconds": 300,
                "instructions": "Identify one worry currently occupying your mind. Ask yourself: What evidence supports this? What is a more balanced perspective?",
                "recommended_for": "worry_rumination"
            },
            {
                "title": "Sleep Routine Reset",
                "description": "Progressive muscular relaxation and digital wind-down for restorative rest.",
                "category": "sleep",
                "duration_seconds": 480,
                "instructions": "Dim surrounding lights. Progressively tense and release muscles starting from your toes up to your shoulders while breathing gently.",
                "recommended_for": "insomnia_fatigue"
            },
            {
                "title": "Exam Stress Decompression",
                "description": "Structured mental reset between intensive study sessions.",
                "category": "cognitive",
                "duration_seconds": 240,
                "instructions": "Step away from screens. Take five deep belly breaths, stretch your neck and shoulders, and sip water.",
                "recommended_for": "exam_pressure"
            }
        ]

        for ex in exercises_data:
            existing = db.query(Exercise).filter(Exercise.title == ex["title"]).first()
            if not existing:
                db.add(Exercise(**ex))
        db.commit()
        print("  [+] Seeded Guided Exercises Library")

        # 3. Seed Students
        students_seed = [
            {"email": "student@mindsaathi.demo", "name": "Alex Sharma", "anon": "STU-2048", "dept": "Computer Science & Engineering", "year": 3},
            {"email": "priya@mindsaathi.demo", "name": "Priya Verma", "anon": "STU-1932", "dept": "Electronics & Communication", "year": 2},
            {"email": "rohit@mindsaathi.demo", "name": "Rohit Das", "anon": "STU-1044", "dept": "Mechanical Engineering", "year": 4}
        ]

        created_students = []
        for s in students_seed:
            u = db.query(User).filter(User.email == s["email"]).first()
            if not u:
                u = User(
                    email=s["email"],
                    password_hash=get_password_hash("password123"),
                    full_name=s["name"],
                    role=UserRole.STUDENT,
                    is_active=True,
                    is_verified=True
                )
                db.add(u)
                db.flush()

                stud = Student(
                    user_id=u.id,
                    anonymous_id=s["anon"],
                    institution_id=inst.id,
                    department=s["dept"],
                    year_of_study=s["year"],
                    preferred_language="en",
                    onboarding_completed=True
                )
                db.add(stud)
                db.flush()

                # Consents
                for ct in [ConsentType.WELLNESS_DATA, ConsentType.AI_ANALYSIS, ConsentType.COUNSELOR_ACCESS, ConsentType.INSTITUTIONAL_ANALYTICS]:
                    db.add(ConsentRecord(student_id=stud.id, consent_type=ct, granted=True))

                created_students.append(stud)
            else:
                created_students.append(u.student_profile)
        db.commit()
        print("  [+] Seeded Students: student@mindsaathi.demo, priya@mindsaathi.demo, rohit@mindsaathi.demo (Password: password123)")

        # 4. Seed Counselors
        counselors_seed = [
            {"email": "counselor@mindsaathi.demo", "name": "Dr. Priya Sharma", "role": "Lead Campus Counselor", "emp": "EMP-9021", "status": VerificationStatus.APPROVED},
            {"email": "rahul.mehta@mindsaathi.demo", "name": "Dr. Rahul Mehta", "role": "Clinical Counselor", "emp": "EMP-8412", "status": VerificationStatus.APPROVED},
            {"email": "ananya.singh@mindsaathi.demo", "name": "Dr. Ananya Singh", "role": "Resident Counselor", "emp": "EMP-3914", "status": VerificationStatus.PENDING}
        ]

        created_counselors = []
        for c in counselors_seed:
            u = db.query(User).filter(User.email == c["email"]).first()
            if not u:
                u = User(
                    email=c["email"],
                    password_hash=get_password_hash("password123"),
                    full_name=c["name"],
                    role=UserRole.COUNSELOR,
                    is_active=True,
                    is_verified=(c["status"] == VerificationStatus.APPROVED)
                )
                db.add(u)
                db.flush()

                counselor = Counselor(
                    user_id=u.id,
                    institution_id=inst.id,
                    professional_role=c["role"],
                    employee_id=c["emp"],
                    department="Student Wellness Center",
                    verification_status=c["status"],
                    availability_status=AvailabilityStatus.AVAILABLE
                )
                db.add(counselor)
                db.flush()
                created_counselors.append(counselor)
            else:
                created_counselors.append(u.counselor_profile)
        db.commit()
        print("  [+] Seeded Counselors: counselor@mindsaathi.demo, rahul.mehta@mindsaathi.demo, ananya.singh@mindsaathi.demo (Password: password123)")

        # 5. Seed Admin
        admin_email = "admin@mindsaathi.demo"
        u_admin = db.query(User).filter(User.email == admin_email).first()
        if not u_admin:
            u_admin = User(
                email=admin_email,
                password_hash=get_password_hash("password123"),
                full_name="Dr. Dinesh Walker",
                role=UserRole.ADMIN,
                is_active=True,
                is_verified=True
            )
            db.add(u_admin)
            db.flush()

            admin_prof = Admin(
                user_id=u_admin.id,
                institution_id=inst.id,
                designation="Dean of Student Wellness & Institutional Affairs",
                authorization_status=AuthorizationStatus.AUTHORIZED
            )
            db.add(admin_prof)
            db.commit()
            print("  [+] Seeded Admin: admin@mindsaathi.demo (Password: password123)")

        # 6. Seed Check-ins for primary student Alex (STU-2048)
        primary_student = created_students[0]
        if primary_student:
            existing_checkins = db.query(WellnessCheckin).filter(WellnessCheckin.student_id == primary_student.id).count()
            if existing_checkins < 5:
                now = datetime.now(timezone.utc)
                checkins_data = [
                    {"days_ago": 6, "mood": 8, "stress": 4, "energy": 7, "sleep": 7.5, "wellness": 78.0, "emotion": "calm", "text": "Productive morning and good sleep."},
                    {"days_ago": 5, "mood": 7, "stress": 5, "energy": 6, "sleep": 7.0, "wellness": 74.0, "emotion": "calm", "text": "Steady day with assignment progress."},
                    {"days_ago": 4, "mood": 6, "stress": 6, "energy": 5, "sleep": 6.5, "wellness": 68.0, "emotion": "anxious", "text": "Midterm preparations starting to feel packed."},
                    {"days_ago": 3, "mood": 5, "stress": 7, "energy": 5, "sleep": 5.5, "wellness": 61.0, "emotion": "overwhelmed", "text": "Struggled with late night study session."},
                    {"days_ago": 2, "mood": 4, "stress": 8, "energy": 4, "sleep": 5.0, "wellness": 54.0, "emotion": "overwhelmed", "text": "Exam stress is mounting, feeling exhausted."},
                    {"days_ago": 1, "mood": 4, "stress": 8, "energy": 4, "sleep": 5.2, "wellness": 52.0, "emotion": "fatigued", "text": "Need to catch up on rest and break down the syllabus."},
                    {"days_ago": 0, "mood": 7, "stress": 5, "energy": 6, "sleep": 6.8, "wellness": 74.0, "emotion": "calm", "text": "Practiced box breathing and mapped out study plan."}
                ]
                for cd in checkins_data:
                    dt = now - timedelta(days=cd["days_ago"])
                    c_obj = WellnessCheckin(
                        student_id=primary_student.id,
                        mood_score=cd["mood"],
                        stress_score=cd["stress"],
                        energy_score=cd["energy"],
                        sleep_hours=cd["sleep"],
                        sleep_quality=cd["mood"],
                        academic_stress=cd["stress"],
                        social_connection=6,
                        journal_text=cd["text"],
                        sentiment_score=0.2 if cd["mood"] >= 6 else -0.4,
                        emotion_label=cd["emotion"],
                        wellness_score=cd["wellness"],
                        risk_level=RiskLevel.HIGH if cd["stress"] >= 8 else RiskLevel.LOW,
                        created_at=dt,
                        updated_at=dt
                    )
                    db.add(c_obj)
                db.commit()
                print("  [+] Seeded 7 Longitudinal Check-ins for Alex (STU-2048)")

        # 7. Seed Private Journal Entries
        if primary_student:
            j_count = db.query(JournalEntry).filter(JournalEntry.student_id == primary_student.id).count()
            if j_count == 0:
                entries = [
                    "Feeling clearer today after organizing my semester schedule. The breathing exercise helped calm my racing thoughts.",
                    "Late night studying is taking a toll on my focus. Want to prioritize getting to bed before midnight this week.",
                    "Met with my project group. Delegating tasks relieved a significant amount of stress."
                ]
                for text in entries:
                    db.add(JournalEntry(
                        student_id=primary_student.id,
                        encrypted_content=encrypt_journal_content(text),
                        mood="Reflective"
                    ))
                db.commit()
                print("  [+] Seeded AES-Encrypted Private Journal Entries")

        # 8. Seed Escalation Cases for Counselor Queue
        if created_counselors and created_students:
            counselor_priya = created_counselors[0]
            existing_cases = db.query(EscalationCase).count()
            if existing_cases == 0:
                cases_data = [
                    {
                        "student": created_students[0], # STU-2048
                        "counselor": counselor_priya,
                        "risk_level": RiskLevel.HIGH,
                        "risk_score": 82,
                        "trigger": "Elevated examination pressure and sustained sleep reduction over 4 consecutive days",
                        "status": EscalationStatus.NEW,
                        "factors": {"mood": 21, "stress": 17, "sleep": 12, "journal": 18, "checkin": 14, "crisis_indicator": 20}
                    },
                    {
                        "student": created_students[1], # STU-1932
                        "counselor": counselor_priya,
                        "risk_level": RiskLevel.MODERATE,
                        "risk_score": 64,
                        "trigger": "Placement preparation fatigue and anxiety indicators",
                        "status": EscalationStatus.MONITORING,
                        "factors": {"mood": 16, "stress": 14, "sleep": 10, "journal": 12, "checkin": 12, "crisis_indicator": 0}
                    },
                    {
                        "student": created_students[2], # STU-1044
                        "counselor": created_counselors[1],
                        "risk_level": RiskLevel.LOW,
                        "risk_score": 38,
                        "trigger": "Routine check-in follow-up post internship transition",
                        "status": EscalationStatus.RESOLVED,
                        "factors": {"mood": 8, "stress": 8, "sleep": 6, "journal": 6, "checkin": 10, "crisis_indicator": 0}
                    }
                ]
                for cd in cases_data:
                    c_case = EscalationCase(
                        student_id=cd["student"].id,
                        assigned_counselor_id=cd["counselor"].id,
                        risk_level=cd["risk_level"],
                        risk_score=cd["risk_score"],
                        trigger_reason=cd["trigger"],
                        status=cd["status"],
                        factors_json=cd["factors"]
                    )
                    db.add(c_case)
                db.commit()
                print("  [+] Seeded 3 Counselor Priority Triage Cases")

        # 9. Seed Appointments & Sessions
        if created_counselors and created_students:
            existing_apts = db.query(Appointment).count()
            if existing_apts == 0:
                counselor_priya = created_counselors[0]
                now = datetime.now(timezone.utc)
                # Upcoming appointment
                apt_upcoming = Appointment(
                    student_id=created_students[0].id,
                    counselor_id=counselor_priya.id,
                    session_type="academic_stress",
                    mode=SessionMode.VIDEO,
                    reason="Academic & Exam Workload Decompression",
                    scheduled_start=now + timedelta(days=1, hours=2),
                    scheduled_end=now + timedelta(days=1, hours=2, minutes=45),
                    duration_minutes=45,
                    status=AppointmentStatus.CONFIRMED,
                    student_notes="Seeking strategies to manage mid-semester exam schedule."
                )
                db.add(apt_upcoming)

                # Completed appointment with session record
                apt_completed = Appointment(
                    student_id=created_students[1].id,
                    counselor_id=counselor_priya.id,
                    session_type="placement_support",
                    mode=SessionMode.IN_PERSON,
                    reason="Placement interview preparation anxiety",
                    scheduled_start=now - timedelta(days=3),
                    scheduled_end=now - timedelta(days=3, minutes=-45),
                    duration_minutes=45,
                    status=AppointmentStatus.COMPLETED,
                    counselor_notes="Student showed great receptiveness to grounding techniques."
                )
                db.add(apt_completed)
                db.flush()

                db.add(SessionRecord(
                    appointment_id=apt_completed.id,
                    discussion_topics="Interview preparation pacing, cognitive thought reframing, sleep consistency before interview rounds.",
                    summary="Student reported feeling overwhelmed by concurrent mock tests. Mapped out a 3-point daily preparation schedule.",
                    recommendations="Practice 5-minute Box Breathing prior to morning sessions; limit preparation past 10:00 PM.",
                    follow_up_required=True,
                    next_follow_up_date=now + timedelta(days=7)
                ))
                db.commit()
                print("  [+] Seeded Appointments & Completed Session Records")

        # 10. Seed Notifications
        for s in created_students:
            db.add(Notification(
                user_id=s.user_id,
                type=NotificationType.WELLNESS_INSIGHT,
                title="Daily Reflection Ready",
                message="Take 60 seconds to check in with your energy and mood today.",
                link_tab="Check-in"
            ))
        db.commit()
        print("  [+] Seeded Notifications")

        # 11. Seed Audit Logs
        db.add(AuditLog(
            actor_user_id="SYSTEM",
            actor_role="system",
            action="SYSTEM_DATABASE_SEEDED",
            resource_type="system",
            resource_id="init"
        ))
        db.commit()
        print("  [+] Seeded Governance Audit Trail")

        print("[SUCCESS] Database Seed Completed Successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    seed()


