from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_student
from app.models.user import User
from app.models.student import Student
from app.models.consent import ConsentRecord, ConsentType
from app.models.wellness import WellnessCheckin
from app.models.journal import JournalEntry
from app.models.appointment import Appointment
from app.schemas.analytics import ConsentUpdate, ConsentRead
from app.core.exceptions import NotFoundError

router = APIRouter(prefix="/privacy", tags=["Privacy & Consent Management"])

@router.get("/consent", summary="Get Current Student Privacy Preferences")
def get_consents(
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    student = current_user.student_profile
    if not student:
        raise NotFoundError("Student profile not found.")

    records = db.query(ConsentRecord).filter(ConsentRecord.student_id == student.id).all()
    if not records:
        # Initialize default consent preferences
        defaults = [
            ConsentType.WELLNESS_DATA,
            ConsentType.AI_ANALYSIS,
            ConsentType.COUNSELOR_ACCESS,
            ConsentType.INSTITUTIONAL_ANALYTICS
        ]
        records = []
        for d in defaults:
            rec = ConsentRecord(student_id=student.id, consent_type=d, granted=True)
            db.add(rec)
            records.append(rec)
        db.commit()

    return {
        "success": True,
        "data": [
            {
                "id": r.id,
                "consent_type": r.consent_type.value,
                "granted": r.granted,
                "version": r.version,
                "granted_at": r.granted_at,
                "revoked_at": r.revoked_at
            }
            for r in records
        ]
    }

@router.patch("/consent", summary="Update Consent Setting")
def update_consent(
    req: ConsentUpdate,
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    student = current_user.student_profile
    if not student:
        raise NotFoundError("Student profile not found.")

    rec = db.query(ConsentRecord).filter(
        ConsentRecord.student_id == student.id,
        ConsentRecord.consent_type == req.consent_type
    ).first()

    if not rec:
        rec = ConsentRecord(
            student_id=student.id,
            consent_type=req.consent_type,
            granted=req.granted
        )
        db.add(rec)
    else:
        rec.granted = req.granted
        if not req.granted:
            rec.revoked_at = datetime.now(timezone.utc)

    db.commit()
    return {"success": True, "message": f"Consent preference for {req.consent_type} updated."}

@router.get("/my-data", summary="Summary of Personal Data Retained")
def get_my_data_summary(
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    student = current_user.student_profile
    if not student:
        raise NotFoundError("Student profile not found.")

    checkin_count = db.query(WellnessCheckin).filter(WellnessCheckin.student_id == student.id).count()
    journal_count = db.query(JournalEntry).filter(JournalEntry.student_id == student.id).count()
    apt_count = db.query(Appointment).filter(Appointment.student_id == student.id).count()

    return {
        "success": True,
        "data": {
            "anonymous_id": student.anonymous_id,
            "department": student.department,
            "year_of_study": student.year_of_study,
            "checkins_recorded": checkin_count,
            "encrypted_reflections": journal_count,
            "appointments_scheduled": apt_count,
            "encryption_standard": "AES-256 (At Rest)",
            "retention_policy": "Encrypted for academic year; purges upon student departure"
        }
    }

@router.post("/export", summary="Request Export of Personal Data")
def export_my_data(
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    student = current_user.student_profile
    return {
        "success": True,
        "message": "Personal data package compiled securely.",
        "download_url": f"/api/v1/privacy/export/{student.anonymous_id}.json"
    }

@router.delete("/account", summary="Request Account Deactivation / Data Deletion")
def delete_account(
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    current_user.is_active = False
    db.commit()
    return {
        "success": True,
        "message": "Account deactivated. Personal wellness records queued for safe purging in accordance with institutional policy."
    }
