from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import require_admin
from app.models.user import User
from app.models.counselor import Counselor, VerificationStatus
from app.models.audit import AuditLog
from app.models.notification import Notification, NotificationType
from app.schemas.counselor import CounselorRead
from app.core.exceptions import NotFoundError

router = APIRouter(prefix="/admin", tags=["Institutional Admin Management"])

@router.get("/counselors", summary="Get All Counselors")
def list_counselors(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    counselors = db.query(Counselor).all()
    results = []
    for c in counselors:
        results.append({
            "id": c.id,
            "user_id": c.user_id,
            "name": c.user.full_name if c.user else "Counselor",
            "email": c.user.email if c.user else "",
            "professional_role": c.professional_role,
            "employee_id": c.employee_id,
            "department": c.department,
            "verification_status": c.verification_status.value,
            "availability_status": c.availability_status.value,
            "cases_count": len(c.assigned_cases),
            "sessions_count": len(c.appointments),
            "response_time": "18 min",
            "created_at": c.created_at
        })
    return {"success": True, "data": results}

@router.get("/counselors/pending", summary="Get Pending Verification Counselors")
def list_pending_counselors(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    pending = db.query(Counselor).filter(
        Counselor.verification_status == VerificationStatus.PENDING
    ).all()
    results = []
    for c in pending:
        results.append({
            "id": c.id,
            "user_id": c.user_id,
            "name": c.user.full_name if c.user else "Counselor",
            "email": c.user.email if c.user else "",
            "professional_role": c.professional_role,
            "employee_id": c.employee_id,
            "department": c.department,
            "verification_status": c.verification_status.value,
            "created_at": c.created_at
        })
    return {"success": True, "data": results}

@router.patch("/counselors/{counselor_id}/approve", summary="Approve Counselor Credentials")
def approve_counselor(
    counselor_id: str,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    counselor = db.query(Counselor).filter(Counselor.id == counselor_id).first()
    if not counselor:
        raise NotFoundError("Counselor not found.")

    counselor.verification_status = VerificationStatus.APPROVED
    if counselor.user:
        counselor.user.is_verified = True

        notif = Notification(
            user_id=counselor.user_id,
            type=NotificationType.COUNSELOR_VERIFICATION,
            title="Institutional Credentials Verified",
            message="Your MindSaathi campus counselor account has been approved. Clinical case access is now active.",
            reference_type="counselor",
            reference_id=counselor.id
        )
        db.add(notif)

    # Audit log
    audit = AuditLog(
        actor_user_id=current_user.id,
        actor_role="admin",
        action="ADMIN_APPROVED_COUNSELOR",
        resource_type="counselor",
        resource_id=counselor.id
    )
    db.add(audit)

    db.commit()
    return {"success": True, "message": "Counselor verified and clinical access activated."}

@router.patch("/counselors/{counselor_id}/reject", summary="Reject Counselor Application")
def reject_counselor(
    counselor_id: str,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    counselor = db.query(Counselor).filter(Counselor.id == counselor_id).first()
    if not counselor:
        raise NotFoundError("Counselor not found.")

    counselor.verification_status = VerificationStatus.REJECTED

    audit = AuditLog(
        actor_user_id=current_user.id,
        actor_role="admin",
        action="ADMIN_REJECTED_COUNSELOR",
        resource_type="counselor",
        resource_id=counselor.id
    )
    db.add(audit)

    db.commit()
    return {"success": True, "message": "Counselor application rejected."}

@router.get("/audit-logs", summary="Get Institutional Governance Audit Logs")
def get_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()
    results = []
    for l in logs:
        results.append({
            "id": l.id,
            "actor_user_id": l.actor_user_id,
            "actor_role": l.actor_role,
            "action": l.action,
            "resource_type": l.resource_type,
            "resource_id": l.resource_id,
            "timestamp": l.created_at.strftime("%Y-%m-%d %H:%M:%S")
        })
    return {"success": True, "data": results}
