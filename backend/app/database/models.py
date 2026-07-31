"""
database/models.py
------------------
SQLAlchemy 2.x ORM table definitions for TEAM_TECH.

Tables:
    scan        – top-level scan record (one per analysis run)
    indicator   – phishing indicators linked to a scan  (1-to-many)
    attachment  – file attachment records linked to a scan  (1-to-many)
    report      – optional JSON / PDF report blobs  (1-to-one per scan)

All primary keys are auto-incrementing integers.
All foreign keys reference scan.scan_id (the UUID string assigned at upload).
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.database import Base


def _utcnow() -> datetime:
    """Return the current UTC datetime (timezone-aware)."""
    return datetime.now(timezone.utc)


# ─── Scan ─────────────────────────────────────────────────────────────────────

class ScanRecord(Base):
    """
    Top-level record created for every completed email analysis run.

    ``scan_id`` is the UUID string returned by the upload endpoint.
    It is used as the foreign key target for child tables.
    """

    __tablename__ = "scan"
    __table_args__ = (
        UniqueConstraint("scan_id", name="uq_scan_scan_id"),
    )

    # Surrogate PK
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # Business key – UUID from upload endpoint
    scan_id: Mapped[str] = mapped_column(
        String(36), nullable=False, index=True, unique=True
    )

    # Email metadata
    sender: Mapped[str | None] = mapped_column(String(512), nullable=True)
    receiver: Mapped[str | None] = mapped_column(String(512), nullable=True)
    subject: Mapped[str | None] = mapped_column(String(1024), nullable=True)

    # Risk result
    risk_score: Mapped[int] = mapped_column(Integer, default=0)
    risk_level: Mapped[str] = mapped_column(String(16), default="Low")

    # Human-readable outputs
    recommendation: Mapped[str | None] = mapped_column(Text, nullable=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=_utcnow,
        server_default=func.now(),
        nullable=False,
    )

    # Relationships (cascade-deletes children when a scan is deleted)
    indicators: Mapped[list["IndicatorRecord"]] = relationship(
        "IndicatorRecord",
        back_populates="scan",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    attachments: Mapped[list["AttachmentRecord"]] = relationship(
        "AttachmentRecord",
        back_populates="scan",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    report: Mapped["ReportRecord | None"] = relationship(
        "ReportRecord",
        back_populates="scan",
        cascade="all, delete-orphan",
        uselist=False,
        lazy="selectin",
    )

    def __repr__(self) -> str:  # pragma: no cover
        return (
            f"<ScanRecord id={self.id} scan_id={self.scan_id!r} "
            f"risk={self.risk_level} created_at={self.created_at}>"
        )


# ─── Indicator ────────────────────────────────────────────────────────────────

class IndicatorRecord(Base):
    """
    A single phishing detection indicator linked to a parent scan.

    Both phishing-engine indicators (Phase 3) and sandbox indicators (Phase 4)
    are stored in this table – distinguished by the ``source`` column.
    """

    __tablename__ = "indicator"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # FK → scan.scan_id
    scan_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("scan.scan_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Indicator data
    name: Mapped[str] = mapped_column(String(256), nullable=False)
    severity: Mapped[str] = mapped_column(String(16), nullable=False)   # Low/Medium/High
    reason: Mapped[str] = mapped_column(Text, nullable=False)

    # 'phishing' | 'sandbox' – which engine produced this indicator
    source: Mapped[str] = mapped_column(String(32), default="phishing", nullable=False)

    scan: Mapped["ScanRecord"] = relationship("ScanRecord", back_populates="indicators")

    def __repr__(self) -> str:  # pragma: no cover
        return (
            f"<IndicatorRecord id={self.id} scan_id={self.scan_id!r} "
            f"name={self.name!r} severity={self.severity!r}>"
        )


# ─── Attachment ───────────────────────────────────────────────────────────────

class AttachmentRecord(Base):
    """
    Metadata for a file attachment associated with a scan.

    Populated from Phase 2 parsed-email attachment data and/or Phase 4 sandbox
    analysis results (sha256, entropy, etc.).
    """

    __tablename__ = "attachment"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # FK → scan.scan_id
    scan_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("scan.scan_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # File identity
    filename: Mapped[str | None] = mapped_column(String(512), nullable=True)
    sha256: Mapped[str | None] = mapped_column(String(64), nullable=True)
    mime_type: Mapped[str | None] = mapped_column(String(128), nullable=True)

    # Static-analysis results
    entropy: Mapped[float | None] = mapped_column(Float, nullable=True)
    size: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Risk assessment for this specific attachment
    risk: Mapped[str | None] = mapped_column(String(16), nullable=True)  # Low/Medium/High/Safe

    scan: Mapped["ScanRecord"] = relationship("ScanRecord", back_populates="attachments")

    def __repr__(self) -> str:  # pragma: no cover
        return (
            f"<AttachmentRecord id={self.id} scan_id={self.scan_id!r} "
            f"filename={self.filename!r} risk={self.risk!r}>"
        )


# ─── Report ───────────────────────────────────────────────────────────────────

class ReportRecord(Base):
    """
    Optional generated report(s) for a scan – stored as raw blobs.

    ``json_report`` holds the full JSON-serialised scan result.
    ``pdf_report``  is reserved for future Phase 6 PDF export (nullable).
    """

    __tablename__ = "report"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # FK → scan.scan_id  (1-to-1 relationship)
    scan_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("scan.scan_id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    json_report: Mapped[str | None] = mapped_column(Text, nullable=True)
    pdf_report: Mapped[bytes | None] = mapped_column(
        # Store as TEXT path or base64 for now; swap to LargeBinary if needed
        Text, nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=_utcnow,
        server_default=func.now(),
        nullable=False,
    )

    scan: Mapped["ScanRecord"] = relationship("ScanRecord", back_populates="report")

    def __repr__(self) -> str:  # pragma: no cover
        return (
            f"<ReportRecord id={self.id} scan_id={self.scan_id!r} "
            f"created_at={self.created_at}>"
        )
