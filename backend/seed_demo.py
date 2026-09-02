"""
MindSaathi — Clean Demo Seed
Creates ONLY:
  1. One institution (MindSaathi University)
  2. One demo student account
  3. One demo counselor account
  4. One demo admin account
  5. All colleges list
NO fake wellness data, checkins, cases, or appointments.
Real users will see clean empty states.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if sys.stdout.encoding != "utf-8":
    try: sys.stdout.reconfigure(encoding="utf-8")
    except: pass

from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.institution import Institution
from app.models.student import Student
from app.models.counselor import Counselor, VerificationStatus, AvailabilityStatus
from app.models.admin import Admin, AuthorizationStatus
from app.models.consent import ConsentRecord, ConsentType

DEMO_PASSWORD = "demo@mindsaathi"

COLLEGES = [
    ("MindSaathi University of Technology", "MSU-2026"),
    ("Indian Institute of Technology Bombay", "IIT-B"),
    ("Indian Institute of Technology Delhi", "IIT-D"),
    ("Indian Institute of Technology Madras", "IIT-M"),
    ("Indian Institute of Technology Kharagpur", "IIT-KGP"),
    ("Indian Institute of Technology Kanpur", "IIT-K"),
    ("Indian Institute of Technology Roorkee", "IIT-R"),
    ("Indian Institute of Technology Hyderabad", "IIT-H"),
    ("Indian Institute of Technology Guwahati", "IIT-G"),
    ("National Institute of Technology Trichy", "NIT-T"),
    ("National Institute of Technology Surathkal", "NIT-S"),
    ("National Institute of Technology Warangal", "NIT-W"),
    ("National Institute of Technology Calicut", "NIT-C"),
    ("National Institute of Technology Rourkela", "NIT-RKL"),
    ("Birla Institute of Technology and Science Pilani", "BITS-PIL"),
    ("Birla Institute of Technology and Science Goa", "BITS-GOA"),
    ("Birla Institute of Technology and Science Hyderabad", "BITS-HYD"),
    ("Vellore Institute of Technology", "VIT"),
    ("Manipal Institute of Technology", "MIT-MAHE"),
    ("SRM Institute of Science and Technology", "SRM"),
    ("Amrita School of Engineering", "AMRITA"),
    ("PSG College of Technology", "PSG"),
    ("Coimbatore Institute of Technology", "CIT"),
    ("Anna University", "AU-CHENNAI"),
    ("Jadavpur University", "JU"),
    ("Delhi Technological University", "DTU"),
    ("Netaji Subhas University of Technology", "NSUT"),
    ("Indraprastha Institute of Information Technology Delhi", "IIIT-D"),
    ("PES University", "PESU"),
    ("RV College of Engineering", "RVCE"),
    ("BMS College of Engineering", "BMSCE"),
    ("MS Ramaiah Institute of Technology", "MSRIT"),
    ("JSS Academy of Technical Education", "JSSATE"),
    ("Thapar Institute of Engineering and Technology", "TIET"),
    ("Chandigarh University", "CU"),
    ("Chitkara University", "CHU"),
    ("LPU Lovely Professional University", "LPU"),
    ("Christ University", "CHRIST"),
    ("Symbiosis Institute of Technology", "SIT-PUNE"),
    ("Pune Institute of Computer Technology", "PICT"),
    ("College of Engineering Pune", "COEP"),
    ("Vishwakarma Institute of Technology", "VIT-PUNE"),
    ("KIIT University", "KIIT"),
    ("Kalinga Institute of Industrial Technology", "KIIT-B"),
    ("Presidency University Bangalore", "PU-BLR"),
    ("CMR Institute of Technology", "CMRIT"),
    ("Dayananda Sagar University", "DSU"),
    ("KLE Technological University", "KLE"),
    ("Ramaiah University of Applied Sciences", "RUAS"),
    ("University of Mumbai", "MU"),
    ("University of Delhi", "DU"),
    ("Jawaharlal Nehru University", "JNU"),
    ("University of Hyderabad", "UOH"),
    ("Osmania University", "OU"),
    ("Bangalore University", "BU"),
    ("Savitribai Phule Pune University", "SPPU"),
    ("University of Calcutta", "CU-CALCUTTA"),
    ("Madras Institute of Technology", "MIT-ANNA"),
    ("Sri Venkateswara College of Engineering", "SVCE"),
    ("Karpagam College of Engineering", "KCE"),
    ("Thiagarajar College of Engineering", "TCE"),
    ("Karunya Institute of Technology and Sciences", "KITS"),
]

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # ── Colleges ──────────────────────────────────────────────
        print("\n[1] Seeding Institutions...")
        for name, code in COLLEGES:
            if not db.query(Institution).filter_by(code=code).first():
                db.add(Institution(name=name, code=code, country="India",
                                   timezone="Asia/Kolkata", privacy_threshold=15))
        db.commit()
        print(f"    {len(COLLEGES)} institutions ready.")

        # ── Main demo institution ─────────────────────────────────
        inst = db.query(Institution).filter_by(code="MSU-2026").first()

        # ── Demo Student ──────────────────────────────────────────
        print("\n[2] Seeding demo student...")
        student_email = "student@mindsaathi.demo"
        student_user = db.query(User).filter_by(email=student_email).first()
        if not student_user:
            student_user = User(
                email=student_email,
                password_hash=get_password_hash("password123"),
                full_name="Demo Student",
                role=UserRole.STUDENT,
                is_active=True,
                is_verified=True,
            )
            db.add(student_user)
            db.flush()
            student = Student(
                user_id=student_user.id,
                institution_id=inst.id,
                anonymous_id="DEMO-STU1",
                department="Computer Science",
                year_of_study=2,
                verification_status=VerificationStatus.APPROVED,
                onboarding_completed=True
            )
            db.add(student)
            db.flush()
            for ct in ConsentType:
                db.add(ConsentRecord(student_id=student.id, consent_type=ct, granted=True))
            db.commit()
            print(f"    Created: {student_email}")

        # ── Demo Counselor ────────────────────────────────────────
        print("\n[3] Seeding demo counselor...")
        counselor_email = "counselor@mindsaathi.demo"
        counselor_user = db.query(User).filter_by(email=counselor_email).first()
        if not counselor_user:
            counselor_user = User(
                email=counselor_email,
                password_hash=get_password_hash("password123"),
                full_name="Dr. Priya Sharma",
                role=UserRole.COUNSELOR,
                is_active=True,
                is_verified=True,
            )
            db.add(counselor_user)
            db.flush()
            counselor = Counselor(
                user_id=counselor_user.id,
                institution_id=inst.id,
                employee_id="EMP-DEMO-001",
                department="Student Wellness Center",
                professional_role="Lead Campus Counselor",
                verification_status=VerificationStatus.APPROVED,
                availability_status=AvailabilityStatus.AVAILABLE,
            )
            db.add(counselor)
            db.commit()
            print(f"    Created: {counselor_email}")

        # ── Demo Admin ────────────────────────────────────────────
        print("\n[4] Seeding demo admin...")
        admin_email = "admin@mindsaathi.demo"
        admin_user = db.query(User).filter_by(email=admin_email).first()
        if not admin_user:
            admin_user = User(
                email=admin_email,
                password_hash=get_password_hash("password123"),
                full_name="Dr. Dinesh Walker",
                role=UserRole.ADMIN,
                is_active=True,
                is_verified=True,
            )
            db.add(admin_user)
            db.flush()
            admin = Admin(
                user_id=admin_user.id,
                institution_id=inst.id,
                authorization_status=AuthorizationStatus.AUTHORIZED,
                designation="Dean of Student Wellness",
            )
            db.add(admin)
            db.commit()
            print(f"    Created: {admin_email}")

        print("\n✅ Seed complete!\n")
        print("  Demo credentials (password: password123):")
        print("    Student   — student@mindsaathi.demo")
        print("    Counselor — counselor@mindsaathi.demo")
        print("    Admin     — admin@mindsaathi.demo\n")

    except Exception as e:
        db.rollback()
        print(f"\n[ERROR] {e}")
        import traceback; traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
