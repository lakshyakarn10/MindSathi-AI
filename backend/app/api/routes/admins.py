from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import require_admin
from app.models.user import User
from app.models.student import Student
from app.models.counselor import Counselor, VerificationStatus
from app.models.audit import AuditLog
from app.models.notification import Notification, NotificationType
from app.schemas.counselor import CounselorRead
from app.core.exceptions import NotFoundError

router = APIRouter(prefix="/admin", tags=["Institutional Admin Management"])

@router.get("/pending/count", summary="Get count of pending student and counselor approvals")
def get_pending_count(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    inst_id = current_user.admin_profile.institution_id if current_user.admin_profile else None
    student_q = db.query(Student).filter(Student.verification_status == VerificationStatus.PENDING)
    counselor_q = db.query(Counselor).filter(Counselor.verification_status == VerificationStatus.PENDING)
    if inst_id:
        student_q = student_q.filter(Student.institution_id == inst_id)
        counselor_q = counselor_q.filter(Counselor.institution_id == inst_id)
    return {
        "success": True,
        "data": {
            "students": student_q.count(),
            "counselors": counselor_q.count(),
            "total": student_q.count() + counselor_q.count()
        }
    }


@router.get("/counselors", summary="Get All Counselors")
def list_counselors(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    inst_id = current_user.admin_profile.institution_id if current_user.admin_profile else None
    query = db.query(Counselor)
    if inst_id:
        query = query.filter(Counselor.institution_id == inst_id)
    counselors = query.all()

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
            "verification_status": c.verification_status.value if hasattr(c.verification_status, 'value') else str(c.verification_status),
            "availability_status": c.availability_status.value if hasattr(c.availability_status, 'value') else str(c.availability_status),
            "institution_name": c.institution.name if c.institution else "",
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
    inst_id = current_user.admin_profile.institution_id if current_user.admin_profile else None
    query = db.query(Counselor).filter(
        Counselor.verification_status == VerificationStatus.PENDING
    )
    if inst_id:
        query = query.filter(Counselor.institution_id == inst_id)
    pending = query.all()

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
            "institution_name": c.institution.name if c.institution else "",
            "verification_status": c.verification_status.value if hasattr(c.verification_status, 'value') else str(c.verification_status),
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
    if counselor.user:
        counselor.user.is_verified = False

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

# ==============================================================
# Student Verifications & Management
# ==============================================================
@router.get("/students", summary="Get All Students Under Admin's Institution")
def list_students(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    inst_id = current_user.admin_profile.institution_id if current_user.admin_profile else None
    query = db.query(Student)
    if inst_id:
        query = query.filter(Student.institution_id == inst_id)
    students = query.all()

    results = []
    for s in students:
        results.append({
            "id": s.id,
            "user_id": s.user_id,
            "name": s.user.full_name if s.user else "Student",
            "email": s.user.email if s.user else "",
            "anonymous_id": s.anonymous_id,
            "department": s.department,
            "year_of_study": s.year_of_study,
            "institution_name": s.institution.name if s.institution else "",
            "verification_status": s.verification_status.value if hasattr(s.verification_status, 'value') else str(s.verification_status),
            "is_verified": s.user.is_verified if s.user else False,
            "created_at": s.created_at
        })
    return {"success": True, "data": results}

@router.get("/students/pending", summary="Get Pending Verification Students")
def list_pending_students(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    inst_id = current_user.admin_profile.institution_id if current_user.admin_profile else None
    query = db.query(Student).filter(
        Student.verification_status == VerificationStatus.PENDING
    )
    if inst_id:
        query = query.filter(Student.institution_id == inst_id)
    pending = query.all()

    results = []
    for s in pending:
        results.append({
            "id": s.id,
            "user_id": s.user_id,
            "name": s.user.full_name if s.user else "Student",
            "email": s.user.email if s.user else "",
            "anonymous_id": s.anonymous_id,
            "department": s.department,
            "year_of_study": s.year_of_study,
            "institution_name": s.institution.name if s.institution else "",
            "verification_status": s.verification_status.value if hasattr(s.verification_status, 'value') else str(s.verification_status),
            "created_at": s.created_at
        })
    return {"success": True, "data": results}

@router.patch("/students/{student_id}/approve", summary="Approve Student Account Request")
def approve_student(
    student_id: str,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise NotFoundError("Student not found.")

    student.verification_status = VerificationStatus.APPROVED
    if student.user:
        student.user.is_verified = True

        notif = Notification(
            user_id=student.user_id,
            type=NotificationType.SYSTEM,
            title="Account Registration Approved",
            message="Your MindSaathi campus student account has been approved by your institution. You can now access wellness services and connect with campus counselors.",
            reference_type="student",
            reference_id=student.id
        )
        db.add(notif)

    # Audit log
    audit = AuditLog(
        actor_user_id=current_user.id,
        actor_role="admin",
        action="ADMIN_APPROVED_STUDENT",
        resource_type="student",
        resource_id=student.id
    )
    db.add(audit)

    db.commit()
    return {"success": True, "message": "Student account approved and activated."}

@router.patch("/students/{student_id}/reject", summary="Reject Student Account Request")
def reject_student(
    student_id: str,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise NotFoundError("Student not found.")

    student.verification_status = VerificationStatus.REJECTED
    if student.user:
        student.user.is_verified = False

    audit = AuditLog(
        actor_user_id=current_user.id,
        actor_role="admin",
        action="ADMIN_REJECTED_STUDENT",
        resource_type="student",
        resource_id=student.id
    )
    db.add(audit)

    db.commit()
    return {"success": True, "message": "Student account request rejected."}

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
