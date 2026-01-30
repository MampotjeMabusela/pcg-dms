from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, Any
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

    @field_validator("status", mode="before")
    @classmethod
    def status_to_str(cls, v: Any) -> str:
        return getattr(v, "value", v) if hasattr(v, "value") else str(v)
