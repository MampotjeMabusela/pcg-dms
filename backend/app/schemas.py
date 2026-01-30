from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: Optional[str] = "viewer"

class UserOut(BaseModel):
    id: int
    email: EmailStr
    role: str
    model_config = {"from_attributes": True}

class DocumentCreate(BaseModel):
    filename: str

class DocumentOut(BaseModel):
    id: int
    filename: str
    vendor: Optional[str]
    invoice_number: Optional[str]
    date: Optional[datetime]
    amount: Optional[float]
    vat: Optional[float]
    status: str
    current_step: int
    is_duplicate: bool
    created_at: datetime
    model_config = {"from_attributes": True}
