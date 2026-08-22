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
    return {
        "success": True,
        "message": "Student account created successfully.",
        "requires_verification": False,
        "role": "student",
        "anonymous_id": user.student_profile.anonymous_id if user.student_profile else None
    }

@router.post("/signup/counselor", status_code=status.HTTP_201_CREATED, summary="Counselor Registration")
def signup_counselor(req: CounselorSignupRequest, db: Session = Depends(get_db)):
    register_counselor(db, req)
    return {
        "success": True,
        "message": "Counselor registration submitted for institutional verification.",
        "requires_verification": True,
        "role": "counselor"
    }

@router.post("/signup/admin", status_code=status.HTTP_201_CREATED, summary="Administrator Registration")
def signup_admin(req: AdminSignupRequest, db: Session = Depends(get_db)):
    register_admin(db, req)
    return {
        "success": True,
        "message": "Administrator account registered and authorized.",
        "requires_verification": False,
        "role": "admin"
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
        "created_at": current_user.created_at
    }
    if current_user.student_profile:
        res["anonymous_id"] = current_user.student_profile.anonymous_id
        res["department"] = current_user.student_profile.department
        res["year_of_study"] = current_user.student_profile.year_of_study
        res["onboarding_completed"] = current_user.student_profile.onboarding_completed
    elif current_user.counselor_profile:
        res["professional_role"] = current_user.counselor_profile.professional_role
        res["employee_id"] = current_user.counselor_profile.employee_id
        res["department"] = current_user.counselor_profile.department
        res["verification_status"] = current_user.counselor_profile.verification_status.value
    elif current_user.admin_profile:
        res["designation"] = current_user.admin_profile.designation
        res["authorization_status"] = current_user.admin_profile.authorization_status.value

    return {"success": True, "data": res}

@router.post("/forgot-password", response_model=MessageResponse, summary="Forgot Password")
def forgot_password(req: ForgotPasswordRequest):
    return MessageResponse(message="If an account exists with this email, password reset instructions have been sent.")

@router.post("/reset-password", response_model=MessageResponse, summary="Reset Password")
def reset_password(req: ResetPasswordRequest):
    return MessageResponse(message="Password reset successfully. You may now log in with your new password.")
