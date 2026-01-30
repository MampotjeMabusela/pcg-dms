import enum
import datetime
from sqlalchemy import Column, Integer, String, DateTime, Float, Enum, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from .db import Base

class RoleEnum(str, enum.Enum):
    admin = "admin"           # Finance/Admin - Step 3
    manager = "manager"       # Manager - Step 2
    reviewer = "reviewer"     # Reviewer - Step 1
    viewer = "viewer"
    approver = "approver"     # Alias for manager (backward compatibility)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(RoleEnum), default=RoleEnum.viewer, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class DocumentStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"

class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    vendor = Column(String, index=True)
    invoice_number = Column(String, index=True)
    date = Column(DateTime)
    amount = Column(Float)
    vat = Column(Float)
    status = Column(Enum(DocumentStatus), default=DocumentStatus.pending)
    current_step = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    is_duplicate = Column(Boolean, default=False)
    raw_text = Column(Text)
    approvals = relationship("Approval", back_populates="document")

class Approval(Base):
    __tablename__ = "approvals"
    id = Column(Integer, primary_key=True)
    document_id = Column(Integer, ForeignKey("documents.id"))
    step = Column(Integer)
    approver_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String)  # approve/reject
    comment = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    document = relationship("Document", back_populates="approvals")
