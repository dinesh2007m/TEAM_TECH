"""
routes/history.py
-----------------
FastAPI router for the Phase 7 Scan History API.

Endpoints (all prefixed /api/v1 in main.py):
    GET     /history                – list all scans, newest first
    GET     /history/{scan_id}      – retrieve a single scan with all children
    DELETE  /history/{scan_id}      – permanently delete a scan and its children

No existing endpoint is modified.
"""

from __future__ import annotations

import logging
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database.crud import (
    count_scans,
    delete_scan,
    get_report,
    get_scan,
    list_scans,
)
from app.database.database import get_db

logger = logging.getLogger("app.routes.history")

router = APIRouter(prefix="/history", tags=["Scan History"])


# ─────────────────────────────────────────────────────────────────────────────
# Pydantic response schemas  (local to this router – no imports from other phases)
# ─────────────────────────────────────────────────────────────────────────────

class IndicatorOut(BaseModel):
    name: str
    severity: str
    reason: str
    source: str

    model_config = {"from_attributes": True}


class AttachmentOut(BaseModel):
    filename: Optional[str] = None
    sha256: Optional[str] = None
    mime_type: Optional[str] = None
    entropy: Optional[float] = None
    size: Optional[int] = None
    risk: Optional[str] = None

    model_config = {"from_attributes": True}


class ReportOut(BaseModel):
    json_report: Optional[str] = Field(None, description="Full scan result as a JSON string")
    pdf_report: Optional[str] = Field(None, description="PDF report path or base64 blob")
    created_at: Optional[Any] = None

    model_config = {"from_attributes": True}


class ScanSummary(BaseModel):
    """Lightweight representation used in list responses."""

    scan_id: str
    sender: Optional[str] = None
    receiver: Optional[str] = None
    subject: Optional[str] = None
    risk_score: int
    risk_level: str
    recommendation: Optional[str] = None
    summary: Optional[str] = None
    created_at: Any
    indicator_count: int = Field(
        0, description="Total number of detection indicators stored for this scan."
    )
    attachment_count: int = Field(
        0, description="Total number of attachment records stored for this scan."
    )

    model_config = {"from_attributes": True}


class ScanDetail(ScanSummary):
    """Full representation including all child records."""

    indicators: list[IndicatorOut] = []
    attachments: list[AttachmentOut] = []
    report: Optional[ReportOut] = None


class HistoryListResponse(BaseModel):
    status: str = "success"
    total: int = Field(..., description="Total scan count in the database.")
    page: int = Field(..., description="Current page (1-indexed).")
    page_size: int = Field(..., description="Maximum records per page.")
    scans: list[ScanSummary]


class HistoryDetailResponse(BaseModel):
    status: str = "success"
    scan: ScanDetail


class DeleteResponse(BaseModel):
    status: str = "success"
    message: str


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _to_summary(record) -> ScanSummary:  # noqa: ANN001
    return ScanSummary(
        scan_id=record.scan_id,
        sender=record.sender,
        receiver=record.receiver,
        subject=record.subject,
        risk_score=record.risk_score,
        risk_level=record.risk_level,
        recommendation=record.recommendation,
        summary=record.summary,
        created_at=record.created_at,
        indicator_count=len(record.indicators),
        attachment_count=len(record.attachments),
    )


def _to_detail(record) -> ScanDetail:  # noqa: ANN001
    indicators = [
        IndicatorOut(
            name=i.name,
            severity=i.severity,
            reason=i.reason,
            source=i.source,
        )
        for i in record.indicators
    ]
    attachments = [
        AttachmentOut(
            filename=a.filename,
            sha256=a.sha256,
            mime_type=a.mime_type,
            entropy=a.entropy,
            size=a.size,
            risk=a.risk,
        )
        for a in record.attachments
    ]
    report_out: Optional[ReportOut] = None
    if record.report:
        report_out = ReportOut(
            json_report=record.report.json_report,
            pdf_report=record.report.pdf_report,
            created_at=record.report.created_at,
        )
    return ScanDetail(
        scan_id=record.scan_id,
        sender=record.sender,
        receiver=record.receiver,
        subject=record.subject,
        risk_score=record.risk_score,
        risk_level=record.risk_level,
        recommendation=record.recommendation,
        summary=record.summary,
        created_at=record.created_at,
        indicator_count=len(indicators),
        attachment_count=len(attachments),
        indicators=indicators,
        attachments=attachments,
        report=report_out,
    )


# ─────────────────────────────────────────────────────────────────────────────
# GET /history
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "",
    response_model=HistoryListResponse,
    status_code=status.HTTP_200_OK,
    summary="List all scan history records (newest first)",
    description=(
        "Returns a paginated list of every completed email scan stored in the "
        "SQLite database, ordered by **created_at descending** (newest first).\n\n"
        "Use ``page`` and ``page_size`` for pagination."
    ),
    responses={
        200: {"description": "Scan list returned successfully."},
        500: {"description": "Internal server error."},
    },
)
def list_history(
    page: int = Query(1, ge=1, description="Page number (1-indexed)."),
    page_size: int = Query(50, ge=1, le=1000, description="Records per page (max 1000)."),
    db: Session = Depends(get_db),
) -> HistoryListResponse:
    """Return all scans, newest first, with pagination."""
    skip = (page - 1) * page_size
    total = count_scans(db)
    records = list_scans(db, skip=skip, limit=page_size)

    logger.info(
        "History list: total=%d page=%d page_size=%d returned=%d",
        total, page, page_size, len(records),
    )

    return HistoryListResponse(
        status="success",
        total=total,
        page=page,
        page_size=page_size,
        scans=[_to_summary(r) for r in records],
    )


# ─────────────────────────────────────────────────────────────────────────────
# GET /history/{scan_id}
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/{scan_id}",
    response_model=HistoryDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve a single scan by scan_id",
    description=(
        "Returns the full record for one scan, including all **phishing indicators**, "
        "**sandbox indicators**, **attachments**, and the stored **JSON report**."
    ),
    responses={
        200: {"description": "Scan found and returned."},
        404: {"description": "No scan found with the given scan_id."},
        500: {"description": "Internal server error."},
    },
)
def get_history_detail(
    scan_id: str,
    db: Session = Depends(get_db),
) -> HistoryDetailResponse:
    """Retrieve full details for a single scan."""
    record = get_scan(db, scan_id=scan_id)
    if record is None:
        logger.warning("History detail: scan_id=%s not found", scan_id)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scan '{scan_id}' not found in the database.",
        )

    logger.info("History detail: scan_id=%s risk=%s", scan_id, record.risk_level)
    return HistoryDetailResponse(status="success", scan=_to_detail(record))


# ─────────────────────────────────────────────────────────────────────────────
# DELETE /history/{scan_id}
# ─────────────────────────────────────────────────────────────────────────────

@router.delete(
    "/{scan_id}",
    response_model=DeleteResponse,
    status_code=status.HTTP_200_OK,
    summary="Delete a scan and all its associated records",
    description=(
        "Permanently deletes the scan identified by ``scan_id`` and all "
        "cascade-linked records (indicators, attachments, report).\n\n"
        "**This action cannot be undone.**"
    ),
    responses={
        200: {"description": "Scan deleted successfully."},
        404: {"description": "No scan found with the given scan_id."},
        500: {"description": "Internal server error."},
    },
)
def delete_history(
    scan_id: str,
    db: Session = Depends(get_db),
) -> DeleteResponse:
    """Delete a scan by scan_id (cascade deletes all children)."""
    deleted = delete_scan(db, scan_id=scan_id)
    if not deleted:
        logger.warning("History delete: scan_id=%s not found", scan_id)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scan '{scan_id}' not found in the database.",
        )

    try:
        db.commit()
    except Exception as exc:
        db.rollback()
        logger.error("Failed to commit delete for scan_id=%s: %s", scan_id, exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error while deleting scan.",
        ) from exc

    logger.info("History delete: scan_id=%s deleted", scan_id)
    return DeleteResponse(
        status="success",
        message=f"Scan '{scan_id}' and all associated records have been permanently deleted.",
    )
