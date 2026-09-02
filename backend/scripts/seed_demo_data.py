"""
MindSaathi Safe Demo Data Seeder (Development / Test Environments ONLY)

Usage:
  python scripts/seed_demo_data.py

Creates standard demo users:
- Student:   student@gtu.edu   / Student@12345
- Counselor: counselor@gtu.edu / Counselor@12345
- Admin:     admin@gtu.edu     / Admin@12345
"""
import os
import sys
from datetime import datetime, timedelta, timezone

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal, engine, Base
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.institution import Institution
from app.models.student import Student
from app.models.counselor import Counselor, VerificationStatus, AvailabilityStatus
from app.models.admin import Admin, AuthorizationStatus
from app.models.appointment import Appointment, AppointmentStatus, SessionMode
from app.models.wellness import WellnessCheckin, RiskLevel
from app.models.message import Conversation, Message
from app.models.notification import Notification, NotificationType


def seed_demo_data():
    if settings.ENVIRONMENT == "production":
        print("ERROR: Demo data seeder is strictly disabled in production environments.")
        sys.exit(1)

    print("[INFO] Initializing MindSaathi Demo Seeder...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Institution
        inst = db.query(Institution).filter(Institution.code == "GTU").first()
        if not inst:
            inst = Institution(
                name="Global Tech University",
                code="GTU",
                country="India",
                timezone="Asia/Kolkata",
                privacy_threshold=15
            )
            db.add(inst)
            db.flush()
            print(f"[OK] Created Institution: {inst.name} ({inst.code})")
        else:
            print(f"[OK] Found existing Institution: {inst.name}")

        # 2. Admin User
        admin_email = "admin@gtu.edu"
        admin_user = db.query(User).filter(User.email == admin_email).first()
        if not admin_user:
            admin_user = User(
                email=admin_email,
                password_hash=get_password_hash("Admin@12345"),
                full_name="Prof. Rajesh Verma",
                role=UserRole.ADMIN,
                is_active=True,
                is_verified=True
            )
            db.add(admin_user)
            db.flush()
            admin_prof = Admin(
                user_id=admin_user.id,
                institution_id=inst.id,
                designation="Dean of Student Welfare",
                authorization_status=AuthorizationStatus.AUTHORIZED
            )
            db.add(admin_prof)
            print("[OK] Created Admin: admin@gtu.edu / Admin@12345")

        # 3. Counselor User
        coun_email = "counselor@gtu.edu"
        coun_user = db.query(User).filter(User.email == coun_email).first()
        if not coun_user:
            coun_user = User(
                email=coun_email,
                password_hash=get_password_hash("Counselor@12345"),
                full_name="Dr. Priya Sharma",
                role=UserRole.COUNSELOR,
                is_active=True,
                is_verified=True
            )
            db.add(coun_user)
            db.flush()

        coun_prof = db.query(Counselor).filter(Counselor.user_id == coun_user.id).first()
        if not coun_prof:
            coun_prof = Counselor(
                user_id=coun_user.id,
                institution_id=inst.id,
                employee_id="EMP-GTU-101",
                professional_role="Senior Campus Counselor",
                department="Student Wellness Center",
                verification_status=VerificationStatus.APPROVED,
                availability_status=AvailabilityStatus.AVAILABLE
            )
            db.add(coun_prof)
            db.flush()
            print("[OK] Created Counselor: counselor@gtu.edu / Counselor@12345")
        else:
            print("[OK] Found Counselor: counselor@gtu.edu")

        # 4. Student User
        stu_email = "student@gtu.edu"
        stu_user = db.query(User).filter(User.email == stu_email).first()
        if not stu_user:
            stu_user = User(
                email=stu_email,
                password_hash=get_password_hash("Student@12345"),
                full_name="Alex River",
                role=UserRole.STUDENT,
                is_active=True,
                is_verified=True
            )
            db.add(stu_user)
            db.flush()

        stu_prof = db.query(Student).filter(Student.user_id == stu_user.id).first()
        if not stu_prof:
            stu_prof = Student(
                user_id=stu_user.id,
                institution_id=inst.id,
                anonymous_id="STU-2048",
                department="Computer Science & Engineering",
                year_of_study=2,
                verification_status=VerificationStatus.APPROVED,
                onboarding_completed=True
            )
            db.add(stu_prof)
            db.flush()
            print("[OK] Created Student: student@gtu.edu / Student@12345")
        else:
            print("[OK] Found Student: student@gtu.edu")

        # 5. Baseline Wellness Check-in (evaluated by ML Risk Engine & Scoring Model)
        if stu_prof:
            from app.services.wellness_service import calculate_composite_wellness_score
            from app.ml.risk_engine import calculate_risk

            now = datetime.now(timezone.utc)

            # Delete old checkin if created on previous test run to ensure today's ML checkin is fresh
            db.query(WellnessCheckin).filter(WellnessCheckin.student_id == stu_prof.id).delete()
            db.flush()

            # Run ML composite scoring model
            m_score, s_score, e_score, s_hours, s_qual = 8, 4, 7, 7.5, 8
            acad_s, soc_c, sent_s = 5, 7, 0.45

            ml_wellness_score = calculate_composite_wellness_score(
                mood_score=m_score,
                stress_score=s_score,
                energy_score=e_score,
                sleep_hours=s_hours,
                sleep_quality=s_qual,
                academic_stress=acad_s,
                social_connection=soc_c,
                sentiment_score=sent_s
            )

            # Run ML risk engine prediction
            ml_risk_info = calculate_risk(
                mood_score=m_score,
                stress_score=s_score,
                sleep_hours=s_hours,
                sentiment_score=sent_s,
                recent_checkins_count=3,
                crisis_flag=False
            )

            checkin = WellnessCheckin(
                student_id=stu_prof.id,
                mood_score=m_score,
                stress_score=s_score,
                energy_score=e_score,
                sleep_hours=s_hours,
                sleep_quality=s_qual,
                academic_stress=acad_s,
                social_connection=soc_c,
                journal_text="Academics & Midterm Preparation — feeling focused and steady.",
                sentiment_score=sent_s,
                emotion_label="calm",
                wellness_score=ml_wellness_score,
                risk_indicator=ml_risk_info["risk_indicator"],
                risk_level=ml_risk_info["risk_level"]
            )
            checkin.created_at = now
            db.add(checkin)
            print(f"[OK] Created ML Predicted Student Check-in (Wellness: {ml_wellness_score}, Risk Indicator: {ml_risk_info['risk_indicator']})")

        # 6. Sample Confirmed CHAT Appointment
        if stu_prof and coun_prof:
            apt = db.query(Appointment).filter(
                Appointment.student_id == stu_prof.id,
                Appointment.counselor_id == coun_prof.id
            ).first()

            if not apt:
                now = datetime.now(timezone.utc)
                apt = Appointment(
                    student_id=stu_prof.id,
                    counselor_id=coun_prof.id,
                    session_type="counseling",
                    mode=SessionMode.CHAT,
                    status=AppointmentStatus.CONFIRMED,
                    reason="Exam pacing & stress reduction",
                    scheduled_start=now + timedelta(hours=2),
                    scheduled_end=now + timedelta(hours=2, minutes=45),
                    duration_minutes=45
                )
                db.add(apt)
                db.flush()

                # Conversation
                conv = Conversation(
                    student_id=stu_prof.id,
                    counselor_id=coun_prof.id,
                    last_message="Hello Alex. I am looking forward to our session."
                )
                db.add(conv)
                db.flush()

                msg = Message(
                    conversation_id=conv.id,
                    sender_id=coun_user.id,
                    sender_role="counselor",
                    content="Hello Alex. I am looking forward to our session.",
                    is_read=True
                )
                db.add(msg)
                print("[OK] Created Confirmed CHAT Appointment & Conversation")
            else:
                print("[OK] Found existing appointment")

        db.commit()
        print("\n[DONE] MindSaathi demo data seeded successfully!")
        print("-" * 50)
        print("STUDENT:   student@gtu.edu   / Student@12345")
        print("COUNSELOR: counselor@gtu.edu / Counselor@12345")
        print("ADMIN:     admin@gtu.edu     / Admin@12345")
        print("-" * 50)

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Seeding error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_demo_data()
