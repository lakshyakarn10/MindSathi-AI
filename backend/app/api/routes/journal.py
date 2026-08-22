from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import require_student
from app.core.security import encrypt_journal_content, decrypt_journal_content
from app.models.user import User
from app.models.journal import JournalEntry
from app.schemas.journal import JournalCreate, JournalRead, JournalUpdate
from app.core.exceptions import NotFoundError, PermissionDeniedError

router = APIRouter(prefix="/journal", tags=["Private Encrypted Journal"])

@router.post("", summary="Create Private Encrypted Journal Entry")
def create_entry(
    req: JournalCreate,
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    student = current_user.student_profile
    if not student:
        raise NotFoundError("Student profile not found.")

    encrypted = encrypt_journal_content(req.content)

    entry = JournalEntry(
        student_id=student.id,
        encrypted_content=encrypted,
        mood=req.mood or "Neutral"
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    return {
        "success": True,
        "message": "Reflection encrypted and saved securely.",
        "data": {
            "id": entry.id,
            "mood": entry.mood,
            "created_at": entry.created_at
        }
    }

@router.get("", summary="Get All Saved Journal Entries (Decrypted for Owner Only)")
def get_my_entries(
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    student = current_user.student_profile
    if not student:
        raise NotFoundError("Student profile not found.")

    entries = db.query(JournalEntry).filter(
        JournalEntry.student_id == student.id
    ).order_by(JournalEntry.created_at.desc()).all()

    results = []
    for e in entries:
        decrypted = decrypt_journal_content(e.encrypted_content)
        results.append({
            "id": e.id,
            "content": decrypted,
            "mood": e.mood,
            "created_at": e.created_at,
            "updated_at": e.updated_at
        })

    return {"success": True, "data": results}

@router.get("/{entry_id}", summary="Get Specific Journal Entry")
def get_entry(
    entry_id: str,
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    student = current_user.student_profile
    if not student:
        raise NotFoundError("Student profile not found.")

    entry = db.query(JournalEntry).filter(
        JournalEntry.id == entry_id,
        JournalEntry.student_id == student.id
    ).first()

    if not entry:
        raise NotFoundError("Journal entry not found.")

    return {
        "success": True,
        "data": {
            "id": entry.id,
            "content": decrypt_journal_content(entry.encrypted_content),
            "mood": entry.mood,
            "created_at": entry.created_at,
            "updated_at": entry.updated_at
        }
    }

@router.patch("/{entry_id}", summary="Update Journal Entry")
def update_entry(
    entry_id: str,
    req: JournalUpdate,
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    student = current_user.student_profile
    if not student:
        raise NotFoundError("Student profile not found.")

    entry = db.query(JournalEntry).filter(
        JournalEntry.id == entry_id,
        JournalEntry.student_id == student.id
    ).first()

    if not entry:
        raise NotFoundError("Journal entry not found.")

    if req.content is not None:
        entry.encrypted_content = encrypt_journal_content(req.content)
    if req.mood is not None:
        entry.mood = req.mood

    db.commit()
    return {"success": True, "message": "Journal entry updated."}

@router.delete("/{entry_id}", summary="Delete Journal Entry")
def delete_entry(
    entry_id: str,
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    student = current_user.student_profile
    if not student:
        raise NotFoundError("Student profile not found.")

    entry = db.query(JournalEntry).filter(
        JournalEntry.id == entry_id,
        JournalEntry.student_id == student.id
    ).first()

    if not entry:
        raise NotFoundError("Journal entry not found.")

    db.delete(entry)
    db.commit()
    return {"success": True, "message": "Journal entry deleted permanently."}
