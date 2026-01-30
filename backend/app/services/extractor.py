import pytesseract
from PIL import Image
import re
from sqlalchemy.orm import Session
from ..db import SessionLocal
from ..model import Document
from ..config import settings
import json
import os

# NOTE: This is a simple extraction pipeline stub. Replace OpenAI parsing with your API key and logic.

def ocr_extract_text(file_path: str) -> str:
    try:
        # Handle PDF files: fast path first (PyPDF2 text), then OCR only if needed
        if file_path.lower().endswith('.pdf'):
            text = ""
            try:
                import PyPDF2
                with open(file_path, 'rb') as f:
                    reader = PyPDF2.PdfReader(f)
                    for page in reader.pages:
                        part = page.extract_text()
                        if part:
                            text += part + "\n"
            except Exception:
                pass
            if text and len(text.strip()) >= 30:
                return text
            try:
                from pdf2image import convert_from_path
                images = convert_from_path(file_path)
                text = ""
                for img in images:
                    text += pytesseract.image_to_string(img) + "\n"
                return text or ""
            except Exception:
                return text or ""

        # Handle image files
        img = Image.open(file_path).convert("L")
        return pytesseract.image_to_string(img) or ""
    except Exception as e:
        print(f"OCR Error: {e}")
        return ""

def simple_parse(text: str) -> dict:
    """Improved parsing with multiple patterns - vendor, date, amount, VAT, invoice number per spec."""
    if not text:
        return {}
    
    invoice_no = None
    amount = None
    vendor = None
    vat = None
    date_str = None
    
    # Try multiple patterns for date (YYYY-MM-DD, DD/MM/YYYY, etc.)
    patterns_date = [
        r"(?:Date|Invoice\s*Date|Due\s*Date)[:\s]*(\d{4}-\d{2}-\d{2})",
        r"(?:Date|Invoice\s*Date)[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})",
        r"(\d{4}-\d{2}-\d{2})",
        r"(\d{1,2}/\d{1,2}/\d{4})",
    ]
    for pattern in patterns_date:
        m = re.search(pattern, text, re.I)
        if m:
            date_str = m.group(1).strip()
            break
    
    # Try multiple patterns for invoice number
    patterns_invoice = [
        r"(?:Invoice|Inv|Invoice\s*No|Invoice\s*#|INV)[:\s#-]*([A-Za-z0-9-]+)",
        r"Invoice\s+Number[:\s]+([A-Za-z0-9-]+)",
        r"INV[:\s]+([A-Za-z0-9-]+)",
    ]
    for pattern in patterns_invoice:
        m = re.search(pattern, text, re.I)
        if m:
            invoice_no = m.group(1).strip()
            break
    
    # Try multiple patterns for amount/total
    patterns_amount = [
        r"(?:Total|Amount|Sum|Balance)[:\s]*\$?\s*([\d,]+\.?\d{0,2})",
        r"\$\s*([\d,]+\.?\d{2})",
        r"(?:Total|Amount)[:\s]*([\d,]+\.?\d{2})",
        r"([\d,]+\.\d{2})\s*(?:USD|EUR|GBP|ZAR|R)",
    ]
    for pattern in patterns_amount:
        m = re.search(pattern, text, re.I)
        if m:
            try:
                amount_str = m.group(1).replace(",", "").strip()
                amount = float(amount_str)
                break
            except:
                continue
    
    # Try to find VAT
    patterns_vat = [
        r"(?:VAT|Tax|GST)[:\s]*\$?\s*([\d,]+\.?\d{0,2})",
        r"(?:VAT|Tax|GST)[:\s]*([\d,]+\.?\d{2})",
    ]
    for pattern in patterns_vat:
        m = re.search(pattern, text, re.I)
        if m:
            try:
                vat_str = m.group(1).replace(",", "").strip()
                vat = float(vat_str)
                break
            except:
                continue
    
    # Extract vendor - look for company names, "From:", "Bill From", etc.
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    
    # Look for vendor indicators
    vendor_patterns = [
        r"(?:From|Bill\s*From|Vendor|Supplier|Company)[:\s]+(.+)",
        r"^([A-Z][A-Za-z\s&]+(?:Inc|LLC|Ltd|Pty|Corp|Company)?)",
    ]
    
    for i, line in enumerate(lines[:10]):  # Check first 10 lines
        for pattern in vendor_patterns:
            m = re.search(pattern, line, re.I)
            if m:
                vendor = m.group(1).strip()[:100]
                break
        if vendor:
            break
    
    # Fallback: use first substantial line as vendor
    if not vendor and lines:
        for line in lines[:5]:
            # Skip common invoice headers
            if not re.match(r"(Invoice|Date|Total|Amount|Tax|VAT)", line, re.I):
                if len(line) > 3 and len(line) < 100:
                    vendor = line[:100]
                    break

    # VAT 15% fallback: if amount is present but VAT not extracted, use 15% of amount for reports
    if vat is None and amount is not None and amount > 0:
        vat = round(float(amount) * 0.15, 2)

    return {
        "invoice_number": invoice_no,
        "amount": amount,
        "vendor": vendor,
        "vat": vat,
        "date": date_str
    }

def process_document_file(doc_id: int, file_path: str):
    db = SessionLocal()
    try:
        doc = db.query(Document).get(doc_id)
        if not doc:
            print(f"Document {doc_id} not found")
            return
        
        print(f"Processing document {doc_id}: {file_path}")
        text = ocr_extract_text(file_path)
        doc.raw_text = text
        
        if not text or len(text.strip()) < 10:
            print(f"Warning: Extracted text is too short or empty for document {doc_id}")
        
        parsed = {}
        # If OpenAI key present, use OpenAI to parse structured JSON (new client API)
        if settings.OPENAI_API_KEY and (text or "").strip():
            try:
                from openai import OpenAI
                client = OpenAI(api_key=settings.OPENAI_API_KEY)
                prompt = (
                    "Extract from this invoice text and return only valid JSON with these keys: "
                    "vendor (string), invoice_number (string), date (YYYY-MM-DD), amount (number), vat (number). "
                    "If a value is missing use null. No markdown or explanation.\n\n" + (text or "")
                )
                resp = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0,
                )
                content = (resp.choices[0].message.content or "").strip()
                # Strip markdown code blocks if present
                if content.startswith("```"):
                    content = re.sub(r"^```(?:json)?\s*", "", content)
                    content = re.sub(r"\s*```$", "", content)
                parsed = json.loads(content) if content else {}
                if isinstance(parsed, dict):
                    print(f"OpenAI extraction successful for document {doc_id}")
                else:
                    parsed = simple_parse(text)
            except Exception as e:
                print(f"OpenAI extraction failed for document {doc_id}: {e}")
                parsed = simple_parse(text) if (text or "").strip() else {}
        else:
            parsed = simple_parse(text) if (text or "").strip() else {}
            print(f"Simple parse results for document {doc_id}: {parsed}")
        
        # Update document fields
        if parsed.get("vendor"):
            doc.vendor = parsed.get("vendor")
            print(f"  Vendor: {doc.vendor}")
        
        if parsed.get("invoice_number"):
            doc.invoice_number = parsed.get("invoice_number")
            print(f"  Invoice #: {doc.invoice_number}")
        
        try:
            amt = parsed.get("amount")
            if amt is not None and amt != "":
                doc.amount = float(amt)
                print(f"  Amount: {doc.amount}")
        except Exception as e:
            print(f"  Error parsing amount: {e}")
        
        try:
            vat_val = parsed.get("vat")
            if vat_val is not None and vat_val != "":
                doc.vat = float(vat_val)
                print(f"  VAT: {doc.vat}")
            elif doc.amount is not None and doc.amount > 0:
                # Ensure VAT (15%) is set for reports when not extracted from document
                doc.vat = round(float(doc.amount) * 0.15, 2)
                print(f"  VAT (15% of amount): {doc.vat}")
        except Exception as e:
            print(f"  Error parsing VAT: {e}")
        
        # Invoice date
        if parsed.get("date"):
            try:
                from datetime import datetime as dt
                d = parsed["date"]
                if re.match(r"\d{4}-\d{2}-\d{2}", d):
                    doc.date = dt.strptime(d[:10], "%Y-%m-%d")
                elif re.match(r"\d{1,2}/\d{1,2}/\d{4}", d):
                    doc.date = dt.strptime(d, "%m/%d/%Y")
                elif re.match(r"\d{1,2}/\d{1,2}/\d{2}", d):
                    doc.date = dt.strptime(d, "%m/%d/%y")
                if doc.date:
                    print(f"  Date: {doc.date}")
            except Exception as e:
                print(f"  Error parsing date: {e}")
        
        # Duplicate detection: invoice number match first, then vendor + amount (per spec)
        if doc.invoice_number:
            existing = db.query(Document).filter(Document.invoice_number == doc.invoice_number, Document.id != doc.id).first()
            if existing:
                doc.is_duplicate = True
                print(f"  Duplicate detected by invoice number")
        elif doc.vendor and doc.amount:
            existing = db.query(Document).filter(Document.vendor == doc.vendor, Document.amount == doc.amount, Document.id != doc.id).first()
            if existing:
                doc.is_duplicate = True
                print(f"  Duplicate detected by vendor and amount")
        
        db.commit()
        print(f"Successfully processed document {doc_id}")
    except Exception as e:
        db.rollback()
        print(f"Error processing document {doc_id}: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()
