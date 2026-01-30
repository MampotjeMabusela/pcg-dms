from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from ..dependencies import get_db
from ..auth import get_current_user
from ..model import Document, DocumentStatus
from datetime import datetime
import io
import json
import math
import pandas as pd

router = APIRouter(prefix="/reports", tags=["reports"])


def _apply_filters(
    query, start=None, end=None, vendor=None, status=None,
    amount_min=None, amount_max=None,
):
    if start:
        query = query.filter(Document.created_at >= datetime.fromisoformat(start))
    if end:
        query = query.filter(Document.created_at <= datetime.fromisoformat(end))
    if vendor:
        query = query.filter(Document.vendor.ilike(f"%{vendor}%"))
    if status and status.strip().lower() in ("pending", "approved", "rejected"):
        query = query.filter(Document.status == DocumentStatus(status.strip().lower()))
    if amount_min is not None:
        query = query.filter(Document.amount >= amount_min)
    if amount_max is not None:
        query = query.filter(Document.amount <= amount_max)
    return query


@router.get("/spend-summary")
def spend_summary(
    start: str | None = None,
    end: str | None = None,
    vendor: str | None = None,
    status: str | None = None,
    amount_min: float | None = None,
    amount_max: float | None = None,
    db: Session = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """Spend summary with filters: date range, vendor, approval status, amount."""
    query = _apply_filters(
        db.query(Document), start, end, vendor, status, amount_min, amount_max
    )
    rows = query.all()
    total = sum(r.amount or 0 for r in rows)
    count = len(rows)
    top_vendors = {}
    for r in rows:
        v = r.vendor or "Unknown"
        top_vendors[v] = top_vendors.get(v, 0) + (r.amount or 0)
    top_vendors_sorted = sorted(top_vendors.items(), key=lambda x: x[1], reverse=True)[:10]
    return {"total": total, "count": count, "top_vendors": top_vendors_sorted}


@router.get("/vendor-analysis")
def vendor_analysis(
    start: str | None = None,
    end: str | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """Vendor analysis: spend by vendor."""
    query = _apply_filters(db.query(Document), start=start, end=end, status=status)
    rows = query.all()
    by_vendor = {}
    for r in rows:
        v = r.vendor or "Unknown"
        by_vendor[v] = by_vendor.get(v, 0) + (r.amount or 0)
    return {"vendors": sorted(by_vendor.items(), key=lambda x: x[1], reverse=True)}


@router.get("/tax-vat-report")
def tax_vat_report(
    start: str | None = None,
    end: str | None = None,
    vendor: str | None = None,
    db: Session = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """Tax/VAT report: amounts and VAT by document."""
    query = _apply_filters(db.query(Document), start=start, end=end, vendor=vendor)
    rows = query.all()
    total_amount = sum(r.amount or 0 for r in rows)
    total_vat = sum(r.vat or 0 for r in rows)
    items = [
        {"vendor": r.vendor, "invoice_number": r.invoice_number, "amount": r.amount, "vat": r.vat}
        for r in rows
    ]
    return {"total_amount": total_amount, "total_vat": total_vat, "items": items}


@router.get("/list")
def report_list(
    start: str | None = None,
    end: str | None = None,
    vendor: str | None = None,
    status: str | None = None,
    amount_min: float | None = None,
    amount_max: float | None = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """List documents with filters for reporting."""
    query = _apply_filters(
        db.query(Document), start, end, vendor, status, amount_min, amount_max
    )
    rows = query.offset(skip).limit(limit).all()
    return [
        {
            "id": r.id,
            "filename": r.filename,
            "vendor": r.vendor,
            "invoice_number": r.invoice_number,
            "date": r.date.isoformat() if r.date else None,
            "amount": r.amount,
            "vat": r.vat,
            "status": r.status.value,
        }
        for r in rows
    ]


@router.get("/export/csv")
def export_csv(
    start: str | None = None,
    end: str | None = None,
    vendor: str | None = None,
    status: str | None = None,
    amount_min: float | None = None,
    amount_max: float | None = None,
    db: Session = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """Export filtered report as CSV."""
    query = _apply_filters(db.query(Document), start, end, vendor, status, amount_min, amount_max)
    rows = query.all()
    data = [
        {
            "vendor": r.vendor,
            "invoice_number": r.invoice_number,
            "date": r.date.strftime("%Y-%m-%d") if r.date else "",
            "amount": r.amount,
            "vat": r.vat,
            "status": r.status.value,
        }
        for r in rows
    ]
    df = pd.DataFrame(data)
    stream = io.StringIO()
    df.to_csv(stream, index=False)
    stream.seek(0)
    return StreamingResponse(
        iter([stream.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=report.csv"},
    )


@router.get("/export/excel")
def export_excel(
    start: str | None = None,
    end: str | None = None,
    vendor: str | None = None,
    status: str | None = None,
    amount_min: float | None = None,
    amount_max: float | None = None,
    db: Session = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """Export filtered report as Excel."""
    try:
        import openpyxl  # noqa: F401 - used by pd.ExcelWriter(engine="openpyxl")
    except ImportError as exc:
        raise HTTPException(
            500, "Excel export requires openpyxl: pip install openpyxl"
        ) from exc
    query = _apply_filters(db.query(Document), start, end, vendor, status, amount_min, amount_max)
    rows = query.all()
    data = [
        {
            "vendor": r.vendor,
            "invoice_number": r.invoice_number,
            "date": r.date,
            "amount": r.amount,
            "vat": r.vat,
            "status": r.status.value,
        }
        for r in rows
    ]
    df = pd.DataFrame(data)
    if df.shape[0] and "date" in df.columns:
        df["date"] = pd.to_datetime(
            df["date"], errors="coerce"
        ).dt.strftime("%Y-%m-%d")
    stream = io.BytesIO()
    with pd.ExcelWriter(stream, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Report")
    stream.seek(0)
    return StreamingResponse(
        stream.read(),
        media_type=(
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ),
        headers={"Content-Disposition": "attachment; filename=report.xlsx"},
    )


@router.get("/export/pdf")
def export_pdf(
    start: str | None = None,
    end: str | None = None,
    vendor: str | None = None,
    status: str | None = None,
    amount_min: float | None = None,
    amount_max: float | None = None,
    db: Session = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """Export filtered report as PDF."""
    try:
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import (
            SimpleDocTemplate,
            Table,
            TableStyle,
            Paragraph,
            Spacer,
        )
        from reportlab.lib.styles import getSampleStyleSheet
    except ImportError as exc:
        raise HTTPException(
            500, "PDF export requires reportlab"
        ) from exc
    query = _apply_filters(db.query(Document), start, end, vendor, status, amount_min, amount_max)
    rows = query.all()
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    elements = []
    elements.append(
        Paragraph("Document Management System - Report", styles["Title"])
    )
    elements.append(Spacer(1, 12))
    elements.append(
        Paragraph(
            f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M')} UTC",
            styles["Normal"],
        )
    )
    elements.append(Spacer(1, 12))
    data = [["Vendor", "Invoice #", "Date", "Amount", "VAT", "Status"]]
    for r in rows:
        data.append([
            (r.vendor or "")[:30],
            (r.invoice_number or "")[:20],
            r.date.strftime("%Y-%m-%d") if r.date else "",
            f"{r.amount:.2f}" if r.amount is not None else "",
            f"{r.vat:.2f}" if r.vat is not None else "",
            r.status.value,
        ])
    t = Table(data)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 10),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
        ("BACKGROUND", (0, 1), (-1, -1), colors.beige),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
    ]))  # noqa: E501
    elements.append(t)
    doc.build(elements)
    buffer.seek(0)
    return StreamingResponse(
        buffer.read(),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=report.pdf"},
    )


def _trend_key(dt, granularity: str) -> str:
    """Return a sortable string key for the given datetime and granularity."""
    if granularity == "minute":
        return dt.strftime("%Y-%m-%d %H:%M")
    if granularity == "hour":
        return dt.strftime("%Y-%m-%d %H:00")
    if granularity == "day":
        return dt.strftime("%Y-%m-%d")
    # month (default)
    return dt.strftime("%Y-%m")


@router.get("/insights")
def ai_insights(
    start: str | None = None,
    end: str | None = None,
    granularity: str = Query(
        "day",
        description="Trend granularity: month, day, hour, minute",
    ),
    db: Session = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """AI Insights: document counts, trends, anomalies, spending insights."""
    if granularity not in ("month", "day", "hour", "minute"):
        granularity = "day"
    query = db.query(Document)
    if start:
        query = query.filter(Document.created_at >= datetime.fromisoformat(start))
    if end:
        end_dt = datetime.fromisoformat(end)
        if len(end) == 10:
            end_dt = end_dt.replace(hour=23, minute=59, second=59, microsecond=999999)
        query = query.filter(Document.created_at <= end_dt)
    rows = query.all()

    # Document counts for dashboard: uploaded, pending, duplicates, approved
    documents_uploaded = len(rows)
    pending = sum(1 for r in rows if r.status.value == "pending")
    approved = sum(1 for r in rows if r.status.value == "approved")
    rejected = sum(1 for r in rows if r.status.value == "rejected")
    duplicates = sum(1 for r in rows if r.is_duplicate)

    # Status breakdown for pie chart (counts)
    status_counts = [
        {"name": "Pending", "value": pending, "status": "pending"},
        {"name": "Approved", "value": approved, "status": "approved"},
        {"name": "Rejected", "value": rejected, "status": "rejected"},
    ]

    # Trends by chosen granularity: document count + spend + per-document amount (one line per doc)
    by_period_count = {}
    by_period_spend = {}
    by_period_doc = {}  # period -> { doc_key: amount }
    doc_keys = []  # ordered list of (key, display_name) for each document in range
    seen_doc_ids = set()
    for r in rows:
        if r.created_at:
            key = _trend_key(r.created_at, granularity)
            by_period_count[key] = by_period_count.get(key, 0) + 1
            by_period_spend[key] = by_period_spend.get(key, 0) + (r.amount or 0)
            doc_key = f"doc_{r.id}"
            by_period_doc.setdefault(key, {})[doc_key] = round(
                float(r.amount or 0), 2
            )
            if r.id not in seen_doc_ids:
                seen_doc_ids.add(r.id)
                doc_keys.append({"key": doc_key, "name": r.filename or f"Doc {r.id}"})
    periods_sorted = sorted(
        set(by_period_count.keys()) | set(by_period_spend.keys())
    )
    trends = []
    for p in periods_sorted:
        row = {
            "period": p,
            "documents": by_period_count.get(p, 0),
            "spend": round(by_period_spend.get(p, 0), 2),
        }
        for d in doc_keys:
            row[d["key"]] = by_period_doc.get(p, {}).get(d["key"], 0)
        trends.append(row)

    amounts = [r.amount for r in rows if r.amount is not None]
    total = sum(amounts)
    count = len(amounts)
    avg = total / count if count else 0
    variance = sum((x - avg) ** 2 for x in amounts) / count if count else 0
    std = math.sqrt(variance) if variance else 0
    threshold = avg + 2 * std if std else None
    anomalies = [
        {
            "id": r.id,
            "filename": r.filename,
            "vendor": r.vendor,
            "amount": r.amount,
        }
        for r in rows
        if r.amount and threshold and r.amount > threshold
    ]

    by_vendor = {}
    for r in rows:
        v = r.vendor or "Unknown"
        by_vendor[v] = by_vendor.get(v, 0) + (r.amount or 0)
    top_vendors = sorted(
        by_vendor.items(), key=lambda x: x[1], reverse=True
    )[:10]
    by_status_spend = {}
    for r in rows:
        s = r.status.value
        by_status_spend[s] = by_status_spend.get(s, 0) + (r.amount or 0)

    return {
        "documents_uploaded": documents_uploaded,
        "pending": pending,
        "approved": approved,
        "rejected": rejected,
        "duplicates": duplicates,
        "status_counts": status_counts,
        "trends": trends,
        "document_series": doc_keys,
        "anomalies": anomalies[:20],
        "spending_insights": {
            "total_spend": total,
            "document_count": count,
            "average_amount": round(avg, 2),
            "top_vendors": [
                {"vendor": v, "total": t} for v, t in top_vendors
            ],
            "by_status": by_status_spend,
        },
    }
