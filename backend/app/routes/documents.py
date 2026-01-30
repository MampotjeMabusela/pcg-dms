from fastapi import APIRouter, UploadFile, File, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session
import os
from ..dependencies import get_db, require_role
from ..auth import get_current_user
from .. import schemas
from ..model import Document, DocumentStatus, Approval
from ..services.extractor import process_document_file
from ..config import settings

router = APIRouter(prefix="/documents", tags=["documents"])

@router.post("/upload", response_model=schemas.DocumentOut)
async def upload_document(background_tasks: BackgroundTasks, file: UploadFile = File(...), db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # Only invoices & credit notes per spec
    if not file.filename.lower().endswith((".pdf", ".png", ".jpg", ".jpeg")):
        raise HTTPException(status_code=400, detail="Only invoices and credit notes (PDF or image) are allowed")
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    saved_path = os.path.join(settings.UPLOAD_DIR, f"{int(os.times().system)}_{file.filename}")
    contents = await file.read()
    with open(saved_path, "wb") as f:
        f.write(contents)
    doc = Document(filename=os.path.basename(saved_path))
    db.add(doc)
    db.commit()
    db.refresh(doc)
    # background processing
    background_tasks.add_task(process_document_file, doc.id, saved_path)
    return doc

@router.get("/", response_model=list[schemas.DocumentOut])
def list_documents(skip: int = 0, limit: int = 50, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    docs = db.query(Document).offset(skip).limit(limit).all()
    return docs

@router.get("/{doc_id}", response_model=schemas.DocumentOut)
def get_document(doc_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    doc = db.query(Document).get(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc

@router.post("/{doc_id}/approve")
def approve_document(doc_id: int, action: str, comment: str = "", db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    doc = db.query(Document).get(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    # Exactly 3 approval stages per spec: Step 1=Reviewer, Step 2=Manager, Step 3=Finance/Admin
    step_allowed_roles = {1: ["reviewer"], 2: ["manager", "approver"], 3: ["admin"]}
    allowed = step_allowed_roles.get(doc.current_step, ["admin"])
    if current_user.role.value not in allowed and current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Not authorized for this step")
    approval = Approval(document_id=doc.id, step=doc.current_step, approver_id=current_user.id, action=action, comment=comment)
    db.add(approval)
    if action == "approve":
        if doc.current_step >= 3:
            doc.status = DocumentStatus.approved
        else:
            doc.current_step += 1
    else:
        doc.status = DocumentStatus.rejected
    db.commit()
    db.refresh(doc)
    return {"status": doc.status.value, "current_step": doc.current_step}
