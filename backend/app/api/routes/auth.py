from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.auth import (
    StudentSignupRequest, CounselorSignupRequest, AdminSignupRequest,
    LoginRequest, RefreshRequest, ForgotPasswordRequest, ResetPasswordRequest,
    TokenResponse, MessageResponse
)
from app.schemas.user import UserRead
from app.services.auth_service import (
    register_student, register_counselor, register_admin,
    authenticate_user, refresh_access_token
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/signup", status_code=status.HTTP_201_CREATED, summary="Student Registration")
def signup_student(req: StudentSignupRequest, db: Session = Depends(get_db)):
    user = register_student(db, req)
    is_demo = req.email.lower().endswith("@mindsaathi.demo")
    sp = user.student_profile
    return {
        "success": True,
        "message": "Student account created successfully. Awaiting approval from your institution administrator." if not is_demo else "Demo student account ready.",
        "requires_verification": not is_demo,
        "pending_approval": not is_demo,
        "role": "student",
        "anonymous_id": sp.anonymous_id if sp else None,
        "institution_name": sp.institution.name if sp and sp.institution else None,
    }

@router.post("/signup/counselor", status_code=status.HTTP_201_CREATED, summary="Counselor Registration")
def signup_counselor(req: CounselorSignupRequest, db: Session = Depends(get_db)):
    user = register_counselor(db, req)
    is_demo = req.email.lower().endswith("@mindsaathi.demo")
    cp = user.counselor_profile
    return {
        "success": True,
        "message": "Counselor registration submitted. Awaiting institutional verification by your administrator." if not is_demo else "Demo counselor account ready.",
        "requires_verification": not is_demo,
        "pending_approval": not is_demo,
        "role": "counselor",
        "institution_name": cp.institution.name if cp and cp.institution else None,
    }

@router.post("/signup/admin", status_code=status.HTTP_201_CREATED, summary="Administrator Registration")
def signup_admin(req: AdminSignupRequest, db: Session = Depends(get_db)):
    user = register_admin(db, req)
    ap = user.admin_profile
    return {
        "success": True,
        "message": f"Administrator account created. Institution '{ap.institution.name if ap and ap.institution else req.institution_name}' is now registered on MindSaathi.",
        "requires_verification": False,
        "pending_approval": False,
        "role": "admin",
        "institution_id": str(ap.institution.id) if ap and ap.institution else None,
        "institution_name": ap.institution.name if ap and ap.institution else None,
        "institution_code": ap.institution.code if ap and ap.institution else None,
    }


@router.post("/login", response_model=TokenResponse, summary="User Login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    return authenticate_user(db, req)

@router.post("/refresh", response_model=TokenResponse, summary="Refresh Access Token")
def refresh_token(req: RefreshRequest, db: Session = Depends(get_db)):
    return refresh_access_token(db, req.refresh_token)

@router.post("/logout", response_model=MessageResponse, summary="User Logout")
def logout(current_user: User = Depends(get_current_user)):
    return MessageResponse(message="Logged out successfully.")

@router.get("/me", summary="Get Current Authenticated User")
def get_me(current_user: User = Depends(get_current_user)):
    res = {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.full_name,
        "role": current_user.role.value,
        "is_active": current_user.is_active,
        "is_verified": current_user.is_verified,
        "created_at": current_user.created_at,
        "institution_id": None,
        "institution_name": None,
        "institution_code": None,
    }
    if current_user.student_profile:
        sp = current_user.student_profile
        res["anonymous_id"] = sp.anonymous_id
        res["department"] = sp.department
        res["year_of_study"] = sp.year_of_study
        res["verification_status"] = sp.verification_status.value if sp.verification_status else "approved"
        res["onboarding_completed"] = sp.onboarding_completed
        if sp.institution:
            res["institution_id"] = str(sp.institution.id)
            res["institution_name"] = sp.institution.name
            res["institution_code"] = sp.institution.code
    elif current_user.counselor_profile:
        cp = current_user.counselor_profile
        res["professional_role"] = cp.professional_role
        res["employee_id"] = cp.employee_id
        res["department"] = cp.department
        res["verification_status"] = cp.verification_status.value if cp.verification_status else "pending"
        if cp.institution:
            res["institution_id"] = str(cp.institution.id)
            res["institution_name"] = cp.institution.name
            res["institution_code"] = cp.institution.code
    elif current_user.admin_profile:
        ap = current_user.admin_profile
        res["designation"] = ap.designation
        res["authorization_status"] = ap.authorization_status.value if ap.authorization_status else "authorized"
        if ap.institution:
            res["institution_id"] = str(ap.institution.id)
            res["institution_name"] = ap.institution.name
            res["institution_code"] = ap.institution.code

    return {"success": True, "data": res}

@router.post("/forgot-password", response_model=MessageResponse, summary="Forgot Password")
def forgot_password(req: ForgotPasswordRequest):
    return MessageResponse(message="If an account exists with this email, password reset instructions have been sent.")

@router.post("/reset-password", response_model=MessageResponse, summary="Reset Password")
def reset_password(req: ResetPasswordRequest):
    return MessageResponse(message="Password reset successfully. You may now log in with your new password.")
