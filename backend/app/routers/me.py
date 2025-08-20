from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import User
from ..schemas import UserOut
from ..deps import get_current_user

router = APIRouter()


@router.get('', response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return current_user
