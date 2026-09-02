import os
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.models.student import Student
from app.models.counselor import Counselor, VerificationStatus
from app.models.institution import Institution
from app.core.security import get_password_hash

def seed_approval_requests():
    print("[INFO] Seeding pending student and counselor approval requests...")
    db = SessionLocal()
    try:
        inst = db.query(Institution).first()
        if not inst:
            inst = Institution(name="MindSaathi University of Technology", code="MSUT_2026")
            db.add(inst)
            db.commit()
            db.refresh(inst)

        # 1. Pending Students
        pending_students_data = [
            {"name": "Aarav Patel", "email": "aarav.p@mindsaathi.demo", "anon_id": "STU-5520", "dept": "Information Technology", "year": 1},
            {"name": "Sneha Reddy", "email": "sneha.r@mindsaathi.demo", "anon_id": "STU-9943", "dept": "Bio-Technology", "year": 2},
            {"name": "Karan Malhotra", "email": "karan.m@mindsaathi.demo", "anon_id": "STU-7712", "dept": "Mechanical Engineering", "year": 3},
            {"name": "Divya Nair", "email": "divya.n@mindsaathi.demo", "anon_id": "STU-4418", "dept": "Civil Engineering", "year": 1},
        ]

        for data in pending_students_data:
            user = db.query(User).filter(User.email == data["email"]).first()
            if not user:
                user = User(
                    email=data["email"],
                    password_hash=get_password_hash("password123"),
                    full_name=data["name"],
                    role=UserRole.STUDENT,
                    is_active=True,
                    is_verified=False
                )
                db.add(user)
                db.flush()

                student = Student(
                    user_id=user.id,
                    anonymous_id=data["anon_id"],
                    institution_id=inst.id,
                    department=data["dept"],
                    year_of_study=data["year"],
                    verification_status=VerificationStatus.PENDING
                )
                db.add(student)

        # 2. Pending Counselors
        pending_counselors_data = [
            {"name": "Dr. Ananya Singh", "email": "ananya.singh@mindsaathi.demo", "emp_id": "EMP-2841", "dept": "Engineering Student Care"},
            {"name": "Dr. Vikram Joshi", "email": "vikram.joshi@mindsaathi.demo", "emp_id": "EMP-2904", "dept": "Hostel & Residential Wellness"},
            {"name": "Dr. Sanya Nair", "email": "sanya.nair@mindsaathi.demo", "emp_id": "EMP-3011", "dept": "Postgraduate Student Support"},
        ]

        for data in pending_counselors_data:
            user = db.query(User).filter(User.email == data["email"]).first()
            if not user:
                user = User(
                    email=data["email"],
                    password_hash=get_password_hash("password123"),
                    full_name=data["name"],
                    role=UserRole.COUNSELOR,
                    is_active=True,
                    is_verified=False
                )
                db.add(user)
                db.flush()

                counselor = Counselor(
                    user_id=user.id,
                    employee_id=data["emp_id"],
                    department=data["dept"],
                    institution_id=inst.id,
                    verification_status=VerificationStatus.PENDING
                )
                db.add(counselor)

        db.commit()
        print("[SUCCESS] Seeded pending student and counselor verification requests in DB!")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Approval seeding failed: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_approval_requests()
