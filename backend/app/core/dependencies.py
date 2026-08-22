from typing import Generator, Optional
from fastapi import Depends, Header
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_token
from app.core.exceptions import AuthenticationError, PermissionDeniedError, NotFoundError
from app.models.user import User, UserRole
from app.models.counselor import VerificationStatus
from app.models.admin import AuthorizationStatus

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> User:
    # Support Authorization header fallback
    auth_token = token
    if not auth_token and authorization and authorization.startswith("Bearer "):
        auth_token = authorization.split(" ")[1]

    if not auth_token:
        raise AuthenticationError("Authorization token required.", code="TOKEN_REQUIRED")

    payload = decode_token(auth_token, expected_type="access")
    user_id = payload.get("sub")
    if not user_id:
        raise AuthenticationError("Malformed token payload.", code="INVALID_TOKEN")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise AuthenticationError("User not found or account deactivated.", code="USER_NOT_FOUND")

    if not user.is_active:
        raise AuthenticationError("User account is inactive.", code="ACCOUNT_INACTIVE")

    return user

def require_student(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.STUDENT:
        raise PermissionDeniedError("Student portal access required.")
    return current_user

def require_counselor(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
    if current_user.role != UserRole.COUNSELOR:
        raise PermissionDeniedError("Counselor credentials required.")

    counselor = current_user.counselor_profile
    if not counselor or counselor.verification_status != VerificationStatus.APPROVED:
        raise PermissionDeniedError("Counselor account is pending institutional verification or rejected.")

    return current_user

def require_admin(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
    if current_user.role != UserRole.ADMIN:
        raise PermissionDeniedError("Institutional administrator credentials required.")

    admin = current_user.admin_profile
    if not admin or admin.authorization_status != AuthorizationStatus.AUTHORIZED:
        raise PermissionDeniedError("Admin account is awaiting institutional authorization.")

    return current_user

def require_counselor_or_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in [UserRole.COUNSELOR, UserRole.ADMIN]:
        raise PermissionDeniedError("Clinical or Administrative credentials required.")
    return current_user
