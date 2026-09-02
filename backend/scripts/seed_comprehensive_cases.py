import sys
import os
from datetime import datetime, timezone, timedelta
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.risk import EscalationCase, EscalationStatus, RiskLevel
from app.models.student import Student
from app.models.counselor import Counselor
from app.models.institution import Institution
from app.models.user import User, UserRole
from app.core.security import get_password_hash

db = SessionLocal()

# Ensure primary demo institution
inst = db.query(Institution).first()
if not inst:
    inst = Institution(name="MindSaathi University of Technology", code="MSUT_2026")
    db.add(inst)
    db.commit()
    db.refresh(inst)

# Ensure counselor
counselor = db.query(Counselor).first()

# Sample cases specification
samples = [
    # 1. NEW Cases
    {
        "anon_id": "STU-2048",
        "dept": "Computer Science & Engineering",
        "year": 3,
        "risk_level": RiskLevel.HIGH,
        "risk_score": 84,
        "status": EscalationStatus.NEW,
        "trigger": "Sustained low mood & acute exam stress",
        "factors": {"mood_decline": 21, "stress_trend": 17, "sleep_reduction": 12, "crisis_signals": 20},
        "notes": "Student expressed difficulty keeping up with midterm prep and reduced sleep schedule (approx 4.5 hrs/night)."
    },
    {
        "anon_id": "STU-7104",
        "dept": "Mechanical Engineering",
        "year": 2,
        "risk_level": RiskLevel.HIGH,
        "risk_score": 79,
        "status": EscalationStatus.NEW,
        "trigger": "Elevated acute distress & isolation flags",
        "factors": {"social_isolation": 18, "mood_variation": 19, "academic_pressure": 16},
        "notes": "Rapid mood decline detected over 3 consecutive check-ins."
    },
    {
        "anon_id": "STU-8821",
        "dept": "Electronics & Communication",
        "year": 4,
        "risk_level": RiskLevel.MODERATE,
        "risk_score": 62,
        "status": EscalationStatus.NEW,
        "trigger": "Placement anxiety and interview pressure",
        "factors": {"placement_stress": 16, "anxiety_spikes": 14, "sleep_disruption": 10},
        "notes": "Student flagged mild panic ahead of campus placement rounds."
    },

    # 2. UNDER REVIEW Cases
    {
        "anon_id": "STU-4402",
        "dept": "Civil Engineering",
        "year": 3,
        "risk_level": RiskLevel.HIGH,
        "risk_score": 86,
        "status": EscalationStatus.REVIEWING,
        "trigger": "Consecutive 4-day distress pattern",
        "factors": {"mood_drop": 23, "acute_stress": 19, "sleep_loss": 15},
        "notes": "Counselor reviewing check-in trajectory before scheduling an in-person session."
    },
    {
        "anon_id": "STU-3120",
        "dept": "Electrical Engineering",
        "year": 2,
        "risk_level": RiskLevel.MODERATE,
        "risk_score": 58,
        "status": EscalationStatus.REVIEWING,
        "trigger": "Academic workload and lab deadline fatigue",
        "factors": {"workload_pressure": 15, "mood_variation": 12},
        "notes": "Currently undergoing review for group mindfulness intervention."
    },
    {
        "anon_id": "STU-6742",
        "dept": "Chemical Engineering",
        "year": 1,
        "risk_level": RiskLevel.MODERATE,
        "risk_score": 55,
        "status": EscalationStatus.REVIEWING,
        "trigger": "First-year hostel adjustment & homesickness",
        "factors": {"homesickness": 14, "sleep_irregularity": 11},
        "notes": "First-year student adapting to campus hostel environment."
    },

    # 3. CONTACTED / IN PROGRESS Cases
    {
        "anon_id": "STU-1932",
        "dept": "Information Technology",
        "year": 3,
        "risk_level": RiskLevel.MODERATE,
        "risk_score": 64,
        "status": EscalationStatus.CONTACTED,
        "trigger": "Midterm fatigue & peer relationship conflict",
        "factors": {"stress_trend": 15, "sleep_irregularities": 9, "mood_variation": 11},
        "notes": "Outreach message sent to student via campus portal; awaiting appointment confirmation."
    },
    {
        "anon_id": "STU-9612",
        "dept": "Biotechnology",
        "year": 4,
        "risk_level": RiskLevel.HIGH,
        "risk_score": 81,
        "status": EscalationStatus.SESSION_SCHEDULED,
        "trigger": "Thesis submission pressure & severe insomnia",
        "factors": {"thesis_burnout": 22, "insomnia": 18, "emotional_exhaustion": 17},
        "notes": "Video counseling session confirmed for Wednesday at 3:00 PM."
    },
    {
        "anon_id": "STU-1044",
        "dept": "Design & Architecture",
        "year": 2,
        "risk_level": RiskLevel.LOW,
        "risk_score": 42,
        "status": EscalationStatus.MONITORING,
        "trigger": "Sleep schedule adjustment & studio workload",
        "factors": {"sleep_concerns": 8, "daytime_fatigue": 6},
        "notes": "Attended sleep hygiene guidance session. Daily check-in tracking active."
    },

    # 4. RESOLVED Cases
    {
        "anon_id": "STU-5891",
        "dept": "Management Studies",
        "year": 2,
        "risk_level": RiskLevel.LOW,
        "risk_score": 32,
        "status": EscalationStatus.RESOLVED,
        "trigger": "Resolved: Academic exam anxiety successfully managed",
        "factors": {"residual_stress": 5},
        "notes": "Student completed 2 individual counseling sessions and reported strong coping progress."
    },
    {
        "anon_id": "STU-7219",
        "dept": "Computer Science & Engineering",
        "year": 1,
        "risk_level": RiskLevel.LOW,
        "risk_score": 28,
        "status": EscalationStatus.RESOLVED,
        "trigger": "Resolved: Initial semester transition completed",
        "factors": {"stabilized_mood": 4},
        "notes": "Joined student peer support circle; wellness scores normalized above 80."
    },
    {
        "anon_id": "STU-9034",
        "dept": "Mathematics & Computing",
        "year": 3,
        "risk_level": RiskLevel.LOW,
        "risk_score": 30,
        "status": EscalationStatus.RESOLVED,
        "trigger": "Resolved: Sleep routine stabilized with breathing exercises",
        "factors": {"steady_sleep": 4},
        "notes": "Practiced 4-7-8 breathing exercises nightly; check-ins consistently steady."
    }
]

# Wipe old escalation cases to cleanly populate sample set
db.query(EscalationCase).delete()
db.commit()

created_count = 0
for idx, s in enumerate(samples):
    # Find or create student
    student = db.query(Student).filter(Student.anonymous_id == s["anon_id"]).first()
    if not student:
        user = User(
            email=f"{s['anon_id'].lower()}@mindsaathi.demo",
            password_hash=get_password_hash("Password123!"),
            full_name=f"Student {s['anon_id']}",
            role=UserRole.STUDENT,
            is_active=True,
            is_verified=True
        )
        db.add(user)
        db.flush()

        student = Student(
            user_id=user.id,
            institution_id=inst.id,
            anonymous_id=s["anon_id"],
            department=s["dept"],
            year_of_study=s["year"]
        )
        db.add(student)
        db.flush()

    case = EscalationCase(
        student_id=student.id,
        assigned_counselor_id=counselor.id if counselor else None,
        risk_level=s["risk_level"],
        risk_score=s["risk_score"],
        status=s["status"],
        trigger_reason=s["trigger"],
        factors_json=s["factors"],
        notes=s["notes"],
        created_at=datetime.now(timezone.utc) - timedelta(hours=idx * 4)
    )
    db.add(case)
    created_count += 1

db.commit()
print(f"Successfully seeded {created_count} comprehensive sample cases across all risk tiers and statuses.")
