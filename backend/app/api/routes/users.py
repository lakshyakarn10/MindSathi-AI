from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.user import UserRead, UserUpdate

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me", response_model=UserRead, summary="Get Current User Profile")
def get_user_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.patch("/me", response_model=UserRead, summary="Update Current User Name")
def update_user_me(
    req: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if req.full_name is not None:
        current_user.full_name = req.full_name
    db.commit()
    db.refresh(current_user)
    return current_user
