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

def _generate_institution_code(db: Session, name: str) -> str:
    words = [w for w in name.strip().split() if w]
    if len(words) >= 2:
        base = "".join([w[0].upper() for w in words[:4]])
    else:
        base = name[:4].upper()
    code = f"{base}-{random.randint(100, 999)}"
    while db.query(Institution).filter(Institution.code == code).first():
        code = f"{base}-{random.randint(1000, 9999)}"
    return code

def _resolve_institution(db: Session, institution_id: str = None, institution_name: str = None, create_if_missing: bool = False) -> Institution:
    if institution_id:
        inst = db.query(Institution).filter(Institution.id == institution_id).first()
        if inst:
            return inst
    if institution_name and institution_name.strip():
        name_clean = institution_name.strip()
        inst = db.query(Institution).filter(Institution.name.ilike(name_clean)).first()
        if not inst:
            inst = db.query(Institution).filter(Institution.name.ilike(f"%{name_clean}%")).first()
        if inst:
            return inst
        if create_if_missing:
            code = _generate_institution_code(db, name_clean)
            inst = Institution(
                name=name_clean,
                code=code,
                country="India",
                timezone="Asia/Kolkata",
                privacy_threshold=15
            )
            db.add(inst)
            db.commit()
            db.refresh(inst)
            return inst
    return None

def register_student(db: Session, req: StudentSignupRequest) -> User:
    existing = db.query(User).filter(User.email == req.email.lower()).first()
    if existing:
        raise ConflictError("An account with this email address already exists.")

    is_demo = req.email.lower().endswith("@mindsaathi.demo")

    if is_demo:
        # Demo accounts always get the default institution
        inst = db.query(Institution).filter(Institution.code == "MSU-2026").first()
        if not inst:
            inst = db.query(Institution).first()
    else:
        # Real users must select an institution registered by an admin
        inst = _resolve_institution(db, req.institution_id, req.institution_name, create_if_missing=False)
        if not inst:
            raise NotFoundError(
                "The selected institution is not registered on MindSaathi. "
                "Please ask your institution administrator to sign up first."
            )

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
        is_verified=True if is_demo else False
    )
    db.add(user)
    db.flush()

    student = Student(
        user_id=user.id,
        anonymous_id=anon_id,
        institution_id=inst.id,
        department=req.department,
        year_of_study=req.year_of_study,
        preferred_language=req.preferred_language,
        verification_status=VerificationStatus.APPROVED if is_demo else VerificationStatus.PENDING,
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

    is_demo = req.email.lower().endswith("@mindsaathi.demo")

    if is_demo:
        inst = db.query(Institution).filter(Institution.code == "MSU-2026").first()
        if not inst:
            inst = db.query(Institution).first()
    else:
        inst = _resolve_institution(db, req.institution_id, req.institution_name, create_if_missing=False)
        if not inst:
            raise NotFoundError(
                "The selected institution is not registered on MindSaathi. "
                "Please ask your institution administrator to sign up first."
            )

    user = User(
        email=req.email.lower(),
        password_hash=get_password_hash(req.password),
        full_name=req.full_name,
        role=UserRole.COUNSELOR,
        is_active=True,
        is_verified=True if is_demo else False
    )
    db.add(user)
    db.flush()

    counselor = Counselor(
        user_id=user.id,
        institution_id=inst.id,
        professional_role=req.professional_role,
        employee_id=req.employee_id,
        department=req.department,
        verification_status=VerificationStatus.APPROVED if is_demo else VerificationStatus.PENDING,
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

    inst = _resolve_institution(db, req.institution_id, req.institution_name, create_if_missing=True)
    if not inst:
        raise NotFoundError("Could not create or find institution. Please provide a valid institution name.")

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
        institution_id=inst.id,
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
    is_demo = user.email.lower().endswith("@mindsaathi.demo")

    if user.role == UserRole.STUDENT and not is_demo:
        student = user.student_profile
        if student:
            if student.verification_status == VerificationStatus.PENDING or not user.is_verified:
                inst_name = student.institution.name if student.institution else "your institution"
                raise PermissionDeniedError(
                    f"Your account registration is pending approval by the administrator at {inst_name}. You will be able to log in once approved."
                )
            elif student.verification_status == VerificationStatus.REJECTED:
                raise PermissionDeniedError("Student registration has been rejected by the institution.")

    elif user.role == UserRole.COUNSELOR and not is_demo:
        counselor = user.counselor_profile
        if counselor:
            if counselor.verification_status == VerificationStatus.PENDING or not user.is_verified:
                inst_name = counselor.institution.name if counselor.institution else "your institution"
                raise PermissionDeniedError(
                    f"Your counselor registration is pending institutional verification at {inst_name}."
                )
            elif counselor.verification_status == VerificationStatus.REJECTED:
                raise PermissionDeniedError("Counselor registration has been rejected by the institution.")

    # Update last login timestamp
    user.last_login_at = datetime.now(timezone.utc)
    db.commit()

    access_token = create_access_token(subject=user.id, role=user.role.value)
    refresh_token = create_refresh_token(subject=user.id, role=user.role.value)

    inst_id = None
    inst_name = None
    inst_code = None

    if user.role == UserRole.STUDENT and user.student_profile:
        if user.student_profile.institution:
            inst_id = str(user.student_profile.institution.id)
            inst_name = user.student_profile.institution.name
            inst_code = user.student_profile.institution.code
    elif user.role == UserRole.COUNSELOR and user.counselor_profile:
        if user.counselor_profile.institution:
            inst_id = str(user.counselor_profile.institution.id)
            inst_name = user.counselor_profile.institution.name
            inst_code = user.counselor_profile.institution.code
    elif user.role == UserRole.ADMIN and user.admin_profile:
        if user.admin_profile.institution:
            inst_id = str(user.admin_profile.institution.id)
            inst_name = user.admin_profile.institution.name
            inst_code = user.admin_profile.institution.code

    user_data = {
        "id": user.id,
        "email": user.email,
        "name": user.full_name,
        "role": user.role.value,
        "is_verified": user.is_verified,
        "institution_id": inst_id,
        "institution_name": inst_name,
        "institution_code": inst_code,
    }
    if user.role == UserRole.STUDENT and user.student_profile:
        user_data["anonymous_id"] = user.student_profile.anonymous_id
        user_data["department"] = user.student_profile.department
        user_data["year_of_study"] = user.student_profile.year_of_study
        user_data["onboarding_completed"] = user.student_profile.onboarding_completed
        user_data["verification_status"] = user.student_profile.verification_status.value
    elif user.role == UserRole.COUNSELOR and user.counselor_profile:
        user_data["employee_id"] = user.counselor_profile.employee_id
        user_data["department"] = user.counselor_profile.department
        user_data["professional_role"] = user.counselor_profile.professional_role
        user_data["verification_status"] = user.counselor_profile.verification_status.value
    elif user.role == UserRole.ADMIN and user.admin_profile:
        user_data["designation"] = user.admin_profile.designation
        user_data["verification_status"] = "approved"

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
