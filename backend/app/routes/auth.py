import json
import time
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .. import schemas
from ..model import User
from ..auth import get_password_hash, verify_password, create_access_token, get_db
from fastapi.security import OAuth2PasswordRequestForm

# #region agent log
_DEBUG_LOG = r"c:\Users\mampo\OneDrive\Documents\dms-project\.cursor\debug.log"
def _dlog(loc, msg, data, hid="H2,H5"):
    try:
        with open(_DEBUG_LOG, "a", encoding="utf-8") as f:
            f.write(json.dumps({"location": loc, "message": msg, "data": data, "timestamp": int(time.time() * 1000), "sessionId": "debug-session", "hypothesisId": hid}) + "\n")
    except Exception:
        pass
# #endregion

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=schemas.UserOut)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(email=user_in.email, hashed_password=get_password_hash(user_in.password), role=user_in.role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/token", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # #region agent log
    _dlog("auth.py:token", "auth token attempt", {"username": form_data.username})
    # #endregion
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        # #region agent log
        _dlog("auth.py:token", "auth token fail", {"reason": "no user or bad password"})
        # #endregion
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect credentials")
    token = create_access_token({"sub": user.email, "role": user.role.value})
    # #region agent log
    _dlog("auth.py:token", "auth token success", {"email": user.email})
    # #endregion
    return {"access_token": token, "token_type": "bearer"}
