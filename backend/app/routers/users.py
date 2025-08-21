from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..db import get_db
from ..models import User
from ..deps import get_current_user

router = APIRouter()


@router.get('')
async def list_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get list of users for ticket assignment"""
    try:
        users = db.query(User).filter(User.id != current_user.id).all()
        return [{"id": user.id, "email": user.email} for user in users]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list users: {str(e)}")
