import random
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token, decode_token
from app.core.exceptions import AuthenticationError, ConflictError, NotFoundError, PermissionDeniedError
from app.models.user import User, UserRole
from app.models.student import Student
from app.models.counselor import Counselor, VerificationStatus, AvailabilityStatus
from app.models.admin import Admin, AuthorizationStatus
from app.models.institution import Institution
from app.schemas.auth import (
    StudentSignupRequest, CounselorSignupRequest, AdminSignupRequest,
    LoginRequest, TokenResponse
)

def _get_or_create_default_institution(db: Session) -> Institution:
    inst = db.query(Institution).first()
    if not inst:
        inst = Institution(
            name="MindSaathi University",
            code="MSU-2026",
            country="India",
            timezone="Asia/Kolkata",
            privacy_threshold=15
        )
        db.add(inst)
        db.commit()
        db.refresh(inst)
    return inst

def register_student(db: Session, req: StudentSignupRequest) -> User:
    existing = db.query(User).filter(User.email == req.email.lower()).first()
    if existing:
        raise ConflictError("An account with this email address already exists.")

    inst = _get_or_create_default_institution(db)

    # Generate anonymous ID e.g. STU-2048
    rand_num = random.randint(1000, 9999)
    anon_id = f"STU-{rand_num}"
    while db.query(Student).filter(Student.anonymous_id == anon_id).first():
        rand_num = random.randint(1000, 9999)
        anon_id = f"STU-{rand_num}"

    user = User(
        email=req.email.lower(),
        password_hash=get_password_hash(req.password),
        full_name=req.full_name,
        role=UserRole.STUDENT,
        is_active=True,
        is_verified=True
    )
    db.add(user)
    db.flush()

    student = Student(
        user_id=user.id,
        anonymous_id=anon_id,
        institution_id=req.institution_id or inst.id,
        department=req.department,
        year_of_study=req.year_of_study,
        preferred_language=req.preferred_language,
        onboarding_completed=False
    )
    db.add(student)
    db.commit()
    db.refresh(user)
    return user

def register_counselor(db: Session, req: CounselorSignupRequest) -> User:
    existing = db.query(User).filter(User.email == req.email.lower()).first()
    if existing:
        raise ConflictError("An account with this email address already exists.")

    inst = _get_or_create_default_institution(db)

    user = User(
        email=req.email.lower(),
        password_hash=get_password_hash(req.password),
        full_name=req.full_name,
        role=UserRole.COUNSELOR,
        is_active=True,
        is_verified=False # Pending institutional verification
    )
    db.add(user)
    db.flush()

    counselor = Counselor(
        user_id=user.id,
        institution_id=req.institution_id or inst.id,
        professional_role=req.professional_role,
        employee_id=req.employee_id,
        department=req.department,
        verification_status=VerificationStatus.PENDING,
        availability_status=AvailabilityStatus.AVAILABLE
    )
    db.add(counselor)
    db.commit()
    db.refresh(user)
    return user

def register_admin(db: Session, req: AdminSignupRequest) -> User:
    existing = db.query(User).filter(User.email == req.email.lower()).first()
    if existing:
        raise ConflictError("An account with this email address already exists.")

    if req.authorization_code != "MINDSAATHI_ADMIN_2026":
        raise PermissionDeniedError("Invalid institutional administrative authorization code.")

    inst = _get_or_create_default_institution(db)

    user = User(
        email=req.email.lower(),
        password_hash=get_password_hash(req.password),
        full_name=req.full_name,
        role=UserRole.ADMIN,
        is_active=True,
        is_verified=True
    )
    db.add(user)
    db.flush()

    admin = Admin(
        user_id=user.id,
        institution_id=req.institution_id or inst.id,
        designation=req.designation,
        authorization_status=AuthorizationStatus.AUTHORIZED
    )
    db.add(admin)
    db.commit()
    db.refresh(user)
    return user

def authenticate_user(db: Session, req: LoginRequest) -> TokenResponse:
    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise AuthenticationError("Incorrect email or password.")

    if not user.is_active:
        raise AuthenticationError("Your account has been deactivated.")

    # Verification checks
    if user.role == UserRole.COUNSELOR:
        counselor = user.counselor_profile
        if counselor and counselor.verification_status == VerificationStatus.REJECTED:
            raise PermissionDeniedError("Counselor registration has been rejected by the institution.")

    # Update last login timestamp
    user.last_login_at = datetime.now(timezone.utc)
    db.commit()

    access_token = create_access_token(subject=user.id, role=user.role.value)
    refresh_token = create_refresh_token(subject=user.id, role=user.role.value)

    user_data = {
        "id": user.id,
        "email": user.email,
        "name": user.full_name,
        "role": user.role.value,
        "is_verified": user.is_verified
    }
    if user.role == UserRole.STUDENT and user.student_profile:
        user_data["anonymous_id"] = user.student_profile.anonymous_id
        user_data["onboarding_completed"] = user.student_profile.onboarding_completed

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=1800,
        user=user_data
    )

def refresh_access_token(db: Session, refresh_token: str) -> TokenResponse:
    payload = decode_token(refresh_token, expected_type="refresh")
    user_id = payload.get("sub")
    if not user_id:
        raise AuthenticationError("Invalid refresh token payload.")

    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise AuthenticationError("User not found or inactive.")

    new_access_token = create_access_token(subject=user.id, role=user.role.value)
    new_refresh_token = create_refresh_token(subject=user.id, role=user.role.value)

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        expires_in=1800,
        user={
            "id": user.id,
            "email": user.email,
            "name": user.full_name,
            "role": user.role.value
        }
    )
