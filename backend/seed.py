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

DEMO_PASSWORD = "password123"

def seed():
    print("[*] Initializing MindSaathi Database Seed (PostgreSQL)...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # ==============================================================
        # 1. Institution — MindSaathi University of Technology
        # ==============================================================
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
            print("  [+] Created Institution: MindSaathi University of Technology (MSU-2026)")
        else:
            print("  [=] Institution already exists: MSU-2026")

        # ==============================================================
        # 2. DEMO ADMIN — admin@mindsaathi.demo / password123
        # ==============================================================
        admin_email = "admin@mindsaathi.demo"
        u_admin = db.query(User).filter(User.email == admin_email).first()
        if not u_admin:
            u_admin = User(
                email=admin_email,
                password_hash=get_password_hash(DEMO_PASSWORD),
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
            print(f"  [+] Created Demo Admin: {admin_email} | Password: {DEMO_PASSWORD}")
        else:
            # Ensure admin profile exists and is linked to institution
            if not u_admin.admin_profile:
                admin_prof = Admin(
                    user_id=u_admin.id,
                    institution_id=inst.id,
                    designation="Dean of Student Wellness & Institutional Affairs",
                    authorization_status=AuthorizationStatus.AUTHORIZED
                )
                db.add(admin_prof)
                db.commit()
            elif not u_admin.admin_profile.institution_id:
                u_admin.admin_profile.institution_id = inst.id
                db.commit()
            print(f"  [=] Demo Admin already exists: {admin_email}")

        # ==============================================================
        # 3. DEMO COUNSELOR — counselor@mindsaathi.demo / password123
        # ==============================================================
        counselor_email = "counselor@mindsaathi.demo"
        u_counselor = db.query(User).filter(User.email == counselor_email).first()
        if not u_counselor:
            u_counselor = User(
                email=counselor_email,
                password_hash=get_password_hash(DEMO_PASSWORD),
                full_name="Dr. Priya Sharma",
                role=UserRole.COUNSELOR,
                is_active=True,
                is_verified=True
            )
            db.add(u_counselor)
            db.flush()
            counselor_prof = Counselor(
                user_id=u_counselor.id,
                institution_id=inst.id,
                professional_role="Lead Campus Counselor",
                employee_id="EMP-9021",
                department="Student Wellness Center",
                verification_status=VerificationStatus.APPROVED,
                availability_status=AvailabilityStatus.AVAILABLE
            )
            db.add(counselor_prof)
            db.commit()
            print(f"  [+] Created Demo Counselor: {counselor_email} | Password: {DEMO_PASSWORD}")
        else:
            if not u_counselor.counselor_profile:
                counselor_prof = Counselor(
                    user_id=u_counselor.id,
                    institution_id=inst.id,
                    professional_role="Lead Campus Counselor",
                    employee_id="EMP-9021",
                    department="Student Wellness Center",
                    verification_status=VerificationStatus.APPROVED,
                    availability_status=AvailabilityStatus.AVAILABLE
                )
                db.add(counselor_prof)
                db.commit()
            else:
                # Ensure approved
                u_counselor.is_verified = True
                u_counselor.counselor_profile.verification_status = VerificationStatus.APPROVED
                u_counselor.counselor_profile.institution_id = inst.id
                db.commit()
            print(f"  [=] Demo Counselor already exists: {counselor_email}")

        # ==============================================================
        # 4. DEMO STUDENT — student@mindsaathi.demo / password123
        # ==============================================================
        student_email = "student@mindsaathi.demo"
        u_student = db.query(User).filter(User.email == student_email).first()
        if not u_student:
            u_student = User(
                email=student_email,
                password_hash=get_password_hash(DEMO_PASSWORD),
                full_name="Alex Sharma",
                role=UserRole.STUDENT,
                is_active=True,
                is_verified=True
            )
            db.add(u_student)
            db.flush()
            # Check for anonymous ID collision
            anon_id = "STU-2048"
            if db.query(Student).filter(Student.anonymous_id == anon_id).first():
                anon_id = "STU-2049"
            student_prof = Student(
                user_id=u_student.id,
                anonymous_id=anon_id,
                institution_id=inst.id,
                department="Computer Science & Engineering",
                year_of_study=3,
                preferred_language="en",
                verification_status=VerificationStatus.APPROVED,
                onboarding_completed=True
            )
            db.add(student_prof)
            db.flush()
            # Add consent records
            for ct in [ConsentType.WELLNESS_DATA, ConsentType.AI_ANALYSIS, ConsentType.COUNSELOR_ACCESS, ConsentType.INSTITUTIONAL_ANALYTICS]:
                db.add(ConsentRecord(student_id=student_prof.id, consent_type=ct, granted=True))
            db.commit()
            print(f"  [+] Created Demo Student: {student_email} | Password: {DEMO_PASSWORD}")
        else:
            if not u_student.student_profile:
                student_prof = Student(
                    user_id=u_student.id,
                    anonymous_id="STU-2048",
                    institution_id=inst.id,
                    department="Computer Science & Engineering",
                    year_of_study=3,
                    preferred_language="en",
                    verification_status=VerificationStatus.APPROVED,
                    onboarding_completed=True
                )
                db.add(student_prof)
                db.commit()
            else:
                u_student.is_verified = True
                u_student.student_profile.verification_status = VerificationStatus.APPROVED
                u_student.student_profile.institution_id = inst.id
                u_student.student_profile.onboarding_completed = True
                db.commit()
            print(f"  [=] Demo Student already exists: {student_email}")

        # ==============================================================
        # 5. Guided Exercises Library
        # ==============================================================
        exercises_data = [
            {"title": "Box Breathing", "description": "Four-count nervous system regulation (Inhale 4s, Hold 4s, Exhale 4s, Rest 4s).", "category": "breathing", "duration_seconds": 120, "instructions": "Sit comfortably. Inhale for 4 counts, hold for 4, exhale for 4, rest for 4.", "recommended_for": "acute_stress"},
            {"title": "5-4-3-2-1 Grounding", "description": "Sensory awareness when thoughts feel scattered.", "category": "grounding", "duration_seconds": 300, "instructions": "Notice 5 things you see, 4 you feel, 3 you hear, 2 you smell, 1 you taste.", "recommended_for": "panic_anxiety"},
            {"title": "Thought Reframing", "description": "Examine automatic anxious thoughts and establish constructive alternatives.", "category": "cognitive", "duration_seconds": 300, "instructions": "Identify a worry. Ask: What evidence supports this? What is a more balanced perspective?", "recommended_for": "worry_rumination"},
            {"title": "Sleep Routine Reset", "description": "Progressive muscular relaxation for restorative rest.", "category": "sleep", "duration_seconds": 480, "instructions": "Progressively tense and release muscles from toes up while breathing gently.", "recommended_for": "insomnia_fatigue"},
            {"title": "Exam Stress Decompression", "description": "Structured mental reset between study sessions.", "category": "cognitive", "duration_seconds": 240, "instructions": "Take 5 deep breaths, stretch your neck and shoulders, sip water.", "recommended_for": "exam_pressure"}
        ]
        for ex in exercises_data:
            existing = db.query(Exercise).filter(Exercise.title == ex["title"]).first()
            if not existing:
                db.add(Exercise(**ex))
        db.commit()
        print("  [+] Seeded Guided Exercises Library")

        # ==============================================================
        # 6. Wellness check-ins for demo student
        # ==============================================================
        primary_student = u_student.student_profile if u_student else None
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
                    {"days_ago": 1, "mood": 4, "stress": 8, "energy": 4, "sleep": 5.2, "wellness": 52.0, "emotion": "fatigued", "text": "Need to catch up on rest."},
                    {"days_ago": 0, "mood": 7, "stress": 5, "energy": 6, "sleep": 6.8, "wellness": 74.0, "emotion": "calm", "text": "Practiced box breathing and mapped out study plan."}
                ]
                for cd in checkins_data:
                    dt = now - timedelta(days=cd["days_ago"])
                    db.add(WellnessCheckin(
                        student_id=primary_student.id,
                        mood_score=cd["mood"], stress_score=cd["stress"], energy_score=cd["energy"],
                        sleep_hours=cd["sleep"], sleep_quality=cd["mood"], academic_stress=cd["stress"],
                        social_connection=6, journal_text=cd["text"],
                        sentiment_score=0.2 if cd["mood"] >= 6 else -0.4, emotion_label=cd["emotion"],
                        wellness_score=cd["wellness"],
                        risk_level=RiskLevel.HIGH if cd["stress"] >= 8 else RiskLevel.LOW,
                        created_at=dt, updated_at=dt
                    ))
                db.commit()
                print("  [+] Seeded 7 Wellness Check-ins for demo student")

        # ==============================================================
        # 7. Journal entries for demo student
        # ==============================================================
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
                print("  [+] Seeded AES-Encrypted Journal Entries for demo student")

        # ==============================================================
        # 8. Appointment for demo student with demo counselor
        # ==============================================================
        demo_counselor_prof = u_counselor.counselor_profile if u_counselor else None
        if primary_student and demo_counselor_prof:
            existing_apts = db.query(Appointment).filter(
                Appointment.student_id == primary_student.id,
                Appointment.counselor_id == demo_counselor_prof.id
            ).count()
            if existing_apts == 0:
                now = datetime.now(timezone.utc)
                apt = Appointment(
                    student_id=primary_student.id,
                    counselor_id=demo_counselor_prof.id,
                    session_type="academic_stress",
                    mode=SessionMode.VIDEO,
                    reason="Academic & Exam Workload Decompression",
                    scheduled_start=now + timedelta(days=1, hours=2),
                    scheduled_end=now + timedelta(days=1, hours=2, minutes=45),
                    duration_minutes=45,
                    status=AppointmentStatus.CONFIRMED,
                    student_notes="Seeking strategies to manage mid-semester exam schedule."
                )
                db.add(apt)
                db.commit()
                print("  [+] Seeded upcoming appointment for demo student & counselor")

        # ==============================================================
        # 9. Notifications
        # ==============================================================
        if primary_student:
            existing_notif = db.query(Notification).filter(
                Notification.user_id == u_student.id,
                Notification.type == NotificationType.WELLNESS_INSIGHT
            ).first()
            if not existing_notif:
                db.add(Notification(
                    user_id=u_student.id,
                    type=NotificationType.WELLNESS_INSIGHT,
                    title="Daily Reflection Ready",
                    message="Take 60 seconds to check in with your energy and mood today.",
                    link_tab="Check-in"
                ))
                db.commit()
                print("  [+] Seeded notifications for demo student")

        # ==============================================================
        # 10. Audit log
        # ==============================================================
        db.add(AuditLog(
            actor_user_id="SYSTEM",
            actor_role="system",
            action="SYSTEM_DATABASE_SEEDED",
            resource_type="system",
            resource_id="init"
        ))
        db.commit()

        print("\n[SUCCESS] MindSaathi Database Seed Complete!")
        print("\n" + "="*60)
        print("  DEMO ACCOUNTS (Password: password123)")
        print("  Student  : student@mindsaathi.demo")
        print("  Counselor: counselor@mindsaathi.demo")
        print("  Admin    : admin@mindsaathi.demo")
        print("="*60)

    except Exception as e:
        print(f"[ERROR] Seed failed: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed()
