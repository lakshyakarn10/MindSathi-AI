from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = 1800
    user: dict

class RefreshRequest(BaseModel):
    refresh_token: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=4)
    role: Optional[str] = "student"

class StudentSignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str
    role: str = "student"
    institution_id: Optional[str] = None
    institution_name: Optional[str] = None
    department: str = "Computer Science & Engineering"
    year_of_study: int = 2
    preferred_language: str = "en"

class CounselorSignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str
    institution_id: Optional[str] = None
    institution_name: Optional[str] = None
    professional_role: str = "Campus Counselor"
    employee_id: str
    department: str = "Student Wellness Center"

class AdminSignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str
    institution_id: Optional[str] = None
    institution_name: Optional[str] = None
    designation: str = "Dean of Student Wellness"
    authorization_code: str = "MINDSAATHI_ADMIN_2026"

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6)

class MessageResponse(BaseModel):
    success: bool = True
    message: str
