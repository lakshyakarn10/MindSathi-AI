import pytest
import os
import sys
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.core.database import Base, get_db
from app.core.security import create_access_token, get_password_hash
from app.models.user import User, UserRole
from app.models.institution import Institution
from app.models.student import Student
from app.models.counselor import Counselor, VerificationStatus, AvailabilityStatus
from app.models.admin import Admin, AuthorizationStatus

TEST_DATABASE_URL = "sqlite:///./test_mindsaathi.db"
test_engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)
    if os.path.exists("./test_mindsaathi.db"):
        try:
            os.remove("./test_mindsaathi.db")
        except Exception:
            pass

@pytest.fixture
def db_session():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()

@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def test_institution(db_session):
    inst = db_session.query(Institution).filter(Institution.code == "TEST-INST").first()
    if not inst:
        inst = Institution(
            name="Test University",
            code="TEST-INST",
            country="India",
            timezone="Asia/Kolkata",
            privacy_threshold=15
        )
        db_session.add(inst)
        db_session.commit()
        db_session.refresh(inst)
    return inst

@pytest.fixture
def student_user(db_session, test_institution):
    user = db_session.query(User).filter(User.email == "test_student@mindsaathi.demo").first()
    if not user:
        user = User(
            email="test_student@mindsaathi.demo",
            password_hash=get_password_hash("password123"),
            full_name="Test Student",
            role=UserRole.STUDENT,
            is_active=True,
            is_verified=True
        )
        db_session.add(user)
        db_session.flush()

        student = Student(
            user_id=user.id,
            anonymous_id="STU-9999",
            institution_id=test_institution.id,
            department="Computer Science",
            year_of_study=3,
            onboarding_completed=True
        )
        db_session.add(student)
        db_session.commit()
        db_session.refresh(user)
    return user

@pytest.fixture
def student_token(student_user):
    return create_access_token(subject=student_user.id, role=student_user.role.value)

@pytest.fixture
def counselor_user(db_session, test_institution):
    user = db_session.query(User).filter(User.email == "test_counselor@mindsaathi.demo").first()
    if not user:
        user = User(
            email="test_counselor@mindsaathi.demo",
            password_hash=get_password_hash("password123"),
            full_name="Dr. Test Counselor",
            role=UserRole.COUNSELOR,
            is_active=True,
            is_verified=True
        )
        db_session.add(user)
        db_session.flush()

        counselor = Counselor(
            user_id=user.id,
            institution_id=test_institution.id,
            professional_role="Lead Counselor",
            employee_id="EMP-TEST",
            verification_status=VerificationStatus.APPROVED,
            availability_status=AvailabilityStatus.AVAILABLE
        )
        db_session.add(counselor)
        db_session.commit()
        db_session.refresh(user)
    return user

@pytest.fixture
def counselor_token(counselor_user):
    return create_access_token(subject=counselor_user.id, role=counselor_user.role.value)

@pytest.fixture
def admin_user(db_session, test_institution):
    user = db_session.query(User).filter(User.email == "test_admin@mindsaathi.demo").first()
    if not user:
        user = User(
            email="test_admin@mindsaathi.demo",
            password_hash=get_password_hash("password123"),
            full_name="Dean Test Admin",
            role=UserRole.ADMIN,
            is_active=True,
            is_verified=True
        )
        db_session.add(user)
        db_session.flush()

        admin = Admin(
            user_id=user.id,
            institution_id=test_institution.id,
            designation="Dean",
            authorization_status=AuthorizationStatus.AUTHORIZED
        )
        db_session.add(admin)
        db_session.commit()
        db_session.refresh(user)
    return user

@pytest.fixture
def admin_token(admin_user):
    return create_access_token(subject=admin_user.id, role=admin_user.role.value)
