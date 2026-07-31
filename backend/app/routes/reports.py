"""
routes/reports.py
-----------------
FastAPI router for Reports API (GET /report/{scan_id}, GET /report/{scan_id}/json, GET /report/{scan_id}/pdf).
"""

import io
import json
import logging
from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

from app.database.crud import get_scan, get_report
from app.database.database import get_db

logger = logging.getLogger("app.routes.reports")

router = APIRouter(prefix="/report", tags=["Reports"])


def _generate_pdf_binary(record, json_data: dict) -> bytes:
    """
    Generate a professional binary PDF document using reportlab.platypus.
    Returns raw bytes beginning with %PDF-.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Title"],
        fontSize=18,
        leading=22,
        textColor=colors.HexColor("#0F172A"),
        alignment=0,
        spaceAfter=6,
    )

    heading_style = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontSize=12,
        leading=15,
        textColor=colors.HexColor("#1E293B"),
        spaceBefore=10,
        spaceAfter=6,
    )

    body_style = ParagraphStyle(
        "BodyCustom",
        parent=styles["BodyText"],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#334155"),
    )

    bold_body_style = ParagraphStyle(
        "BoldBodyCustom",
        parent=body_style,
        fontName="Helvetica-Bold",
    )

    code_style = ParagraphStyle(
        "CodeCustom",
        parent=body_style,
        fontName="Courier",
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#0F172A"),
    )

    story = []

    # Title Banner
    story.append(Paragraph("<b>TEAM_TECH — Cybersecurity Email Analysis Report</b>", title_style))
    created_str = record.created_at.isoformat() if record.created_at else "N/A"
    story.append(Paragraph(f"Generated at: {created_str}", body_style))
    story.append(Spacer(1, 10))

    # Metadata Table
    meta_data = [
        [Paragraph("<b>Scan ID:</b>", body_style), Paragraph(str(record.scan_id), code_style)],
        [Paragraph("<b>Sender:</b>", body_style), Paragraph(str(record.sender or "—"), body_style)],
        [Paragraph("<b>Receiver:</b>", body_style), Paragraph(str(record.receiver or "—"), body_style)],
        [Paragraph("<b>Subject:</b>", body_style), Paragraph(str(record.subject or "—"), body_style)],
    ]
    meta_table = Table(meta_data, colWidths=[90, 450])
    meta_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
            ("PADDING", (0, 0), (-1, -1), 5),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ])
    )
    story.append(meta_table)
    story.append(Spacer(1, 12))

    # Risk Assessment Section
    story.append(Paragraph("Risk Assessment & Summary", heading_style))

    risk_hex = (
        "#EF4444" if record.risk_level == "High"
        else "#F59E0B" if record.risk_level == "Medium"
        else "#10B981"
    )

    risk_data = [
        [
            Paragraph("<b>Overall Risk Level:</b>", body_style),
            Paragraph(f"<font color='{risk_hex}'><b>{record.risk_level}</b></font>", bold_body_style),
            Paragraph("<b>Risk Score:</b>", body_style),
            Paragraph(f"<b>{record.risk_score} / 100</b>", bold_body_style),
        ],
        [
            Paragraph("<b>Summary:</b>", body_style),
            Paragraph(str(record.summary or "—"), body_style),
            Paragraph("<b>Recommendation:</b>", body_style),
            Paragraph(str(record.recommendation or "—"), body_style),
        ],
    ]
    risk_table = Table(risk_data, colWidths=[110, 160, 110, 160])
    risk_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F1F5F9")),
            ("PADDING", (0, 0), (-1, -1), 6),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ])
    )
    story.append(risk_table)
    story.append(Spacer(1, 12))

    # Phishing & Sandbox Indicators Section
    story.append(Paragraph(f"Detection Indicators ({len(record.indicators)})", heading_style))
    if record.indicators:
        ind_rows = [
            [
                Paragraph("<b>Indicator Name</b>", bold_body_style),
                Paragraph("<b>Severity</b>", bold_body_style),
                Paragraph("<b>Source</b>", bold_body_style),
                Paragraph("<b>Trigger Reason</b>", bold_body_style),
            ]
        ]
        for ind in record.indicators:
            sev_hex = "#EF4444" if ind.severity == "High" else "#F59E0B" if ind.severity == "Medium" else "#3B82F6"
            ind_rows.append([
                Paragraph(str(ind.name), body_style),
                Paragraph(f"<font color='{sev_hex}'><b>{ind.severity}</b></font>", body_style),
                Paragraph(str(ind.source), body_style),
                Paragraph(str(ind.reason), body_style),
            ])
        ind_table = Table(ind_rows, colWidths=[120, 60, 60, 300])
        ind_table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E2E8F0")),
                ("PADDING", (0, 0), (-1, -1), 5),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ])
        )
        story.append(ind_table)
    else:
        story.append(Paragraph("No suspicious detection indicators raised.", body_style))

    story.append(Spacer(1, 12))

    # Attachments & Static Sandbox Section
    story.append(Paragraph(f"Attachments & Static Sandbox ({len(record.attachments)})", heading_style))
    if record.attachments:
        att_rows = [
            [
                Paragraph("<b>Filename</b>", bold_body_style),
                Paragraph("<b>MIME / Size</b>", bold_body_style),
                Paragraph("<b>Entropy / Risk</b>", bold_body_style),
                Paragraph("<b>SHA-256 Hash</b>", bold_body_style),
            ]
        ]
        for att in record.attachments:
            att_rows.append([
                Paragraph(str(att.filename or "—"), body_style),
                Paragraph(f"{att.mime_type or '—'}<br/>{att.size or 0} bytes", body_style),
                Paragraph(f"Entropy: {att.entropy or 0:.2f}<br/>Risk: {att.risk or '—'}", body_style),
                Paragraph(str(att.sha256 or "—"), code_style),
            ])
        att_table = Table(att_rows, colWidths=[120, 110, 110, 200])
        att_table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E2E8F0")),
                ("PADDING", (0, 0), (-1, -1), 5),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ])
        )
        story.append(att_table)
    else:
        story.append(Paragraph("No attachments associated with this scan.", body_style))

    story.append(Spacer(1, 16))
    story.append(Paragraph("<i>Report generated automatically by TEAM_TECH Cybersecurity Platform.</i>", body_style))

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()

    return pdf_bytes


@router.get(
    "/{scan_id}",
    summary="Get full report data for a scan from database",
)
def get_report_data(scan_id: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    record = get_scan(db, scan_id=scan_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scan '{scan_id}' not found in database.",
        )

    report_rec = get_report(db, scan_id=scan_id)
    json_data = {}
    if report_rec and report_rec.json_report:
        try:
            json_data = json.loads(report_rec.json_report)
        except Exception:
            pass

    return {
        "status": "success",
        "scan_id": record.scan_id,
        "created_at": record.created_at.isoformat() if record.created_at else None,
        "sender": record.sender,
        "receiver": record.receiver,
        "subject": record.subject,
        "risk_score": record.risk_score,
        "risk_level": record.risk_level,
        "summary": record.summary,
        "recommendation": record.recommendation,
        "indicators": [
            {
                "name": i.name,
                "severity": i.severity,
                "reason": i.reason,
                "source": i.source,
            }
            for i in record.indicators
        ],
        "attachments": [
            {
                "filename": a.filename,
                "sha256": a.sha256,
                "mime_type": a.mime_type,
                "entropy": a.entropy,
                "size": a.size,
                "risk": a.risk,
            }
            for i in record.attachments
        ],
        "report_detail": json_data,
    }


@router.get(
    "/{scan_id}/json",
    summary="Download scan analysis as JSON file directly from database",
)
def download_report_json(scan_id: str, db: Session = Depends(get_db)) -> Response:
    record = get_scan(db, scan_id=scan_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scan '{scan_id}' not found in database.",
        )

    data = get_report_data(scan_id, db)
    json_bytes = json.dumps(data, indent=2, default=str).encode("utf-8")

    return Response(
        content=json_bytes,
        media_type="application/json",
        headers={
            "Content-Disposition": f'attachment; filename="analysis_{scan_id[:8]}.json"'
        },
    )


@router.get(
    "/{scan_id}/pdf",
    summary="Download scan analysis report as PDF document directly from database",
)
def download_report_pdf(scan_id: str, db: Session = Depends(get_db)) -> Response:
    record = get_scan(db, scan_id=scan_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scan '{scan_id}' not found in database.",
        )

    report_rec = get_report(db, scan_id=scan_id)
    json_data = {}
    if report_rec and report_rec.json_report:
        try:
            json_data = json.loads(report_rec.json_report)
        except Exception:
            pass

    pdf_bytes = _generate_pdf_binary(record, json_data)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="report_{scan_id[:8]}.pdf"'
        },
    )
