from enum import Enum
from sqlalchemy import Column, String, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.core.database import Base

class AuthorizationStatus(str, Enum):
    AUTHORIZED = "authorized"
    PENDING = "pending"
    REVOKED = "revoked"

class Admin(Base):
    __tablename__ = "admins"

    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    institution_id = Column(String(36), ForeignKey("institutions.id"), nullable=True)
    designation = Column(String(100), default="Dean of Student Wellness", nullable=False)
    authorization_status = Column(SQLEnum(AuthorizationStatus), default=AuthorizationStatus.AUTHORIZED, nullable=False)

    # Relationships
    user = relationship("User", back_populates="admin_profile")
    institution = relationship("Institution", back_populates="admins")
