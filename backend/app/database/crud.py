"""
database/crud.py
----------------
CRUD (Create / Read / Update / Delete) operations for TEAM_TECH.

All functions accept an explicit ``Session`` so they can be used in both
synchronous route handlers and background tasks without coupling to the
request lifecycle.

No business logic lives here — only database I/O.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select, desc, func
from sqlalchemy.orm import Session

from app.database.models import (
    AttachmentRecord,
    IndicatorRecord,
    ReportRecord,
    ScanRecord,
)

logger = logging.getLogger("app.database.crud")


# ─────────────────────────────────────────────────────────────────────────────
# Internal helpers
# ─────────────────────────────────────────────────────────────────────────────

def _now() -> datetime:
    return datetime.now(timezone.utc)


# ─────────────────────────────────────────────────────────────────────────────
# Scan
# ─────────────────────────────────────────────────────────────────────────────

def create_scan(
    db: Session,
    *,
    scan_id: str,
    sender: Optional[str],
    receiver: Optional[str],
    subject: Optional[str],
    risk_score: int,
    risk_level: str,
    recommendation: Optional[str] = None,
    summary: Optional[str] = None,
) -> ScanRecord:
    """
    Persist a new scan record.

    If a record with the same ``scan_id`` already exists (idempotent re-save),
    the existing record is returned without modification.
    """
    existing = get_scan(db, scan_id=scan_id)
    if existing:
        logger.debug("Scan %s already persisted – skipping duplicate insert.", scan_id)
        return existing

    record = ScanRecord(
        scan_id=scan_id,
        sender=sender,
        receiver=receiver,
        subject=subject,
        risk_score=risk_score,
        risk_level=risk_level,
        recommendation=recommendation,
        summary=summary,
    )
    db.add(record)
    db.flush()  # obtain the PK without committing
    logger.info("Scan created: scan_id=%s risk=%s score=%d", scan_id, risk_level, risk_score)
    return record


def get_scan(db: Session, *, scan_id: str) -> Optional[ScanRecord]:
    """Retrieve a single scan by its UUID string, or None if not found."""
    stmt = select(ScanRecord).where(ScanRecord.scan_id == scan_id)
    return db.execute(stmt).scalars().first()


def list_scans(
    db: Session,
    *,
    skip: int = 0,
    limit: int = 100,
) -> list[ScanRecord]:
    """
    Return all scans ordered by ``created_at`` descending (newest first).

    Args:
        skip:  Number of records to skip (for pagination).
        limit: Maximum number of records to return.
    """
    stmt = (
        select(ScanRecord)
        .order_by(desc(ScanRecord.created_at))
        .offset(skip)
        .limit(limit)
    )
    return list(db.execute(stmt).scalars().all())


def count_scans(db: Session) -> int:
    """Return the total number of scan records in the database."""
    stmt = select(func.count()).select_from(ScanRecord)
    return db.execute(stmt).scalar_one()


def delete_scan(db: Session, *, scan_id: str) -> bool:
    """
    Delete a scan and all its children (cascade) by scan_id.

    Returns:
        True  if a record was found and deleted.
        False if no record existed with the given scan_id.
    """
    record = get_scan(db, scan_id=scan_id)
    if record is None:
        return False
    db.delete(record)
    db.flush()
    logger.info("Scan deleted: scan_id=%s", scan_id)
    return True


# ─────────────────────────────────────────────────────────────────────────────
# Indicators
# ─────────────────────────────────────────────────────────────────────────────

def add_indicators(
    db: Session,
    *,
    scan_id: str,
    indicators: list[dict],
    source: str = "phishing",
) -> list[IndicatorRecord]:
    """
    Bulk-insert indicator records for a scan.

    Args:
        scan_id:    The parent scan UUID.
        indicators: List of dicts with keys ``name``, ``severity``, ``reason``.
        source:     Engine that produced these indicators ('phishing' | 'sandbox').

    Returns:
        The list of created IndicatorRecord objects.
    """
    records: list[IndicatorRecord] = []
    for ind in indicators:
        record = IndicatorRecord(
            scan_id=scan_id,
            name=ind.get("name", "Unknown"),
            severity=ind.get("severity", "Low"),
            reason=ind.get("reason", ""),
            source=source,
        )
        db.add(record)
        records.append(record)
    if records:
        db.flush()
        logger.debug(
            "Inserted %d %s indicator(s) for scan_id=%s", len(records), source, scan_id
        )
    return records


def get_indicators(
    db: Session, *, scan_id: str, source: Optional[str] = None
) -> list[IndicatorRecord]:
    """
    Return all indicators for a scan, optionally filtered by source.
    """
    stmt = select(IndicatorRecord).where(IndicatorRecord.scan_id == scan_id)
    if source:
        stmt = stmt.where(IndicatorRecord.source == source)
    return list(db.execute(stmt).scalars().all())


# ─────────────────────────────────────────────────────────────────────────────
# Attachments
# ─────────────────────────────────────────────────────────────────────────────

def add_attachments(
    db: Session,
    *,
    scan_id: str,
    attachments: list[dict],
) -> list[AttachmentRecord]:
    """
    Bulk-insert attachment metadata records for a scan.

    Args:
        scan_id:     The parent scan UUID.
        attachments: List of dicts with keys matching AttachmentRecord columns.

    Returns:
        The list of created AttachmentRecord objects.
    """
    records: list[AttachmentRecord] = []
    for att in attachments:
        record = AttachmentRecord(
            scan_id=scan_id,
            filename=att.get("filename"),
            sha256=att.get("sha256"),
            mime_type=att.get("mime_type") or att.get("content_type"),
            entropy=att.get("entropy"),
            size=att.get("size"),
            risk=att.get("risk"),
        )
        db.add(record)
        records.append(record)
    if records:
        db.flush()
        logger.debug(
            "Inserted %d attachment record(s) for scan_id=%s", len(records), scan_id
        )
    return records


def get_attachments(db: Session, *, scan_id: str) -> list[AttachmentRecord]:
    """Return all attachments for a scan."""
    stmt = select(AttachmentRecord).where(AttachmentRecord.scan_id == scan_id)
    return list(db.execute(stmt).scalars().all())


# ─────────────────────────────────────────────────────────────────────────────
# Reports
# ─────────────────────────────────────────────────────────────────────────────

def upsert_report(
    db: Session,
    *,
    scan_id: str,
    json_report: Optional[dict] = None,
    pdf_report: Optional[str] = None,
) -> ReportRecord:
    """
    Create or update the report record for a scan.

    ``json_report`` is serialised to a JSON string before storage.
    ``pdf_report``  is a file-path string or base64 blob (future use).
    """
    stmt = select(ReportRecord).where(ReportRecord.scan_id == scan_id)
    existing: Optional[ReportRecord] = db.execute(stmt).scalars().first()

    json_str: Optional[str] = None
    if json_report is not None:
        try:
            json_str = json.dumps(json_report, default=str, ensure_ascii=False)
        except (TypeError, ValueError) as exc:
            logger.warning("Failed to serialise json_report for scan %s: %s", scan_id, exc)

    if existing:
        if json_str is not None:
            existing.json_report = json_str
        if pdf_report is not None:
            existing.pdf_report = pdf_report
        db.flush()
        return existing

    record = ReportRecord(
        scan_id=scan_id,
        json_report=json_str,
        pdf_report=pdf_report,
    )
    db.add(record)
    db.flush()
    logger.debug("Report record created for scan_id=%s", scan_id)
    return record


def get_report(db: Session, *, scan_id: str) -> Optional[ReportRecord]:
    """Return the report record for a scan, or None."""
    stmt = select(ReportRecord).where(ReportRecord.scan_id == scan_id)
    return db.execute(stmt).scalars().first()


# ─────────────────────────────────────────────────────────────────────────────
# Convenience: save a full scan in one call
# ─────────────────────────────────────────────────────────────────────────────

def save_full_scan(
    db: Session,
    *,
    scan_id: str,
    sender: Optional[str],
    receiver: Optional[str],
    subject: Optional[str],
    risk_score: int,
    risk_level: str,
    recommendation: Optional[str],
    summary: Optional[str],
    phishing_indicators: list[dict],
    sandbox_indicators: list[dict],
    attachments: list[dict],
    json_report: Optional[dict] = None,
) -> ScanRecord:
    """
    Atomically persist a completed scan and all its children.

    Wraps create_scan, add_indicators (×2), add_attachments, and upsert_report
    in a single call.  The caller is responsible for committing the session.

    Args:
        scan_id:             Upload UUID from Phase 2.
        sender:              Email From header.
        receiver:            Email To header.
        subject:             Email Subject.
        risk_score:          0-100 integer risk score.
        risk_level:          Safe / Low / Medium / High.
        recommendation:      Human-readable remediation advice.
        summary:             Short narrative summary of the scan.
        phishing_indicators: List of dicts from Phase 3 PhishingIndicator.
        sandbox_indicators:  List of dicts from Phase 4 SandboxIndicator.
        attachments:         List of attachment metadata dicts.
        json_report:         Full scan result dict to serialise as JSON.

    Returns:
        The ScanRecord (already flushed, not yet committed).
    """
    scan = create_scan(
        db,
        scan_id=scan_id,
        sender=sender,
        receiver=receiver,
        subject=subject,
        risk_score=risk_score,
        risk_level=risk_level,
        recommendation=recommendation,
        summary=summary,
    )

    if phishing_indicators:
        add_indicators(db, scan_id=scan_id, indicators=phishing_indicators, source="phishing")

    if sandbox_indicators:
        add_indicators(db, scan_id=scan_id, indicators=sandbox_indicators, source="sandbox")

    if attachments:
        add_attachments(db, scan_id=scan_id, attachments=attachments)

    if json_report is not None:
        upsert_report(db, scan_id=scan_id, json_report=json_report)

    return scan
