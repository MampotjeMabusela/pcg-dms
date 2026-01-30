from fastapi import Depends, HTTPException
from .auth import get_current_user
from .model import RoleEnum
from sqlalchemy.orm import Session
from .db import SessionLocal

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def require_role(required_roles: list):
    def role_checker(current_user = Depends(get_current_user)):
        if current_user.role.value not in required_roles and current_user.role != RoleEnum.admin:
            raise HTTPException(status_code=403, detail="Insufficient role")
        return current_user
    return role_checker
