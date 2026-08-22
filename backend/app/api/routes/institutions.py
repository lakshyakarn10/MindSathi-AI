from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.institution import Institution

router = APIRouter(prefix="/institutions", tags=["Institutions"])

@router.get("", summary="List all registered institutions (public)")
def list_institutions(db: Session = Depends(get_db)):
    institutions = db.query(Institution).order_by(Institution.name).all()
    return {
        "success": True,
        "data": [
            {
                "id": str(inst.id),
                "name": inst.name,
                "code": inst.code,
                "country": inst.country,
                "timezone": inst.timezone,
            }
            for inst in institutions
        ]
    }
