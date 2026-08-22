from typing import Any, Dict, Optional
from fastapi import HTTPException, status

class MindSaathiException(HTTPException):
    def __init__(
        self,
        status_code: int,
        code: str,
        message: str,
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            status_code=status_code,
            detail={
                "success": False,
                "error": {
                    "code": code,
                    "message": message,
                    "details": details or {}
                }
            }
        )

class AuthenticationError(MindSaathiException):
    def __init__(self, message: str = "Invalid credentials or token expired.", code: str = "AUTHENTICATION_FAILED"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            code=code,
            message=message
        )

class PermissionDeniedError(MindSaathiException):
    def __init__(self, message: str = "You do not have permission to perform this action.", code: str = "PERMISSION_DENIED"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            code=code,
            message=message
        )

class NotFoundError(MindSaathiException):
    def __init__(self, message: str = "Resource not found.", code: str = "NOT_FOUND"):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            code=code,
            message=message
        )

class ConflictError(MindSaathiException):
    def __init__(self, message: str = "Resource already exists or state conflict.", code: str = "CONFLICT"):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            code=code,
            message=message
        )

class ValidationError(MindSaathiException):
    def __init__(self, message: str = "Validation failed.", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            code="VALIDATION_ERROR",
            message=message,
            details=details
        )

class PrivacyRestrictionError(MindSaathiException):
    def __init__(self, message: str = "Data hidden to protect student privacy (k-anonymity threshold not met)."):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            code="PRIVACY_THRESHOLD_VIOLATION",
            message=message
        )
