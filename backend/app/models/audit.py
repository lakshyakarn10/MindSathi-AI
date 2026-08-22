from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, JSON
from app.core.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    actor_user_id = Column(String(36), index=True, nullable=False)
    actor_role = Column(String(20), nullable=False) # student, counselor, admin, system
    action = Column(String(100), index=True, nullable=False) # e.g. ADMIN_GENERATED_REPORT, COUNSELOR_VIEWED_CASE
    resource_type = Column(String(50), nullable=False) # case, appointment, report, user
    resource_id = Column(String(36), nullable=True)
    ip_address = Column(String(50), default="127.0.0.1", nullable=False)
    metadata_json = Column(JSON, nullable=True)
