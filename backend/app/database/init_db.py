"""
database/init_db.py
-------------------
Database initialisation utilities.

call ``init_db()`` once at application startup (from main.py lifespan) to:
  1. Create all tables (idempotent – CREATE TABLE IF NOT EXISTS).
  2. Log the database path.

Call ``seed_sample_scans()`` (optional, CLI / test use only) to populate the
database with 10 representative sample scans for demonstration / smoke-testing.
"""

from __future__ import annotations

import json
import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.database.database import Base, SessionLocal, engine
from app.database.crud import save_full_scan

logger = logging.getLogger("app.database.init_db")


# ─── Schema creation ──────────────────────────────────────────────────────────

def init_db() -> None:
    """
    Create all SQLAlchemy-managed tables if they do not already exist.

    Safe to call multiple times (uses CREATE TABLE IF NOT EXISTS internally).
    """
    # Import models so their classes are registered on Base.metadata
    from app.database import models  # noqa: F401 – side-effect import

    Base.metadata.create_all(bind=engine)
    logger.info("Database tables verified/created at: %s", engine.url)


# ─── Sample data ──────────────────────────────────────────────────────────────

_SAMPLE_SCANS: list[dict[str, Any]] = [
    # ── 1 · Clean email ──────────────────────────────────────────────────────
    {
        "sender": "alice@example.com",
        "receiver": "bob@example.com",
        "subject": "Team meeting tomorrow at 9 AM",
        "risk_score": 0,
        "risk_level": "Safe",
        "recommendation": "No action required. Email appears legitimate.",
        "summary": "Internal meeting invitation with no suspicious signals.",
        "phishing_indicators": [],
        "sandbox_indicators": [],
        "attachments": [],
    },
    # ── 2 · Urgency phishing ─────────────────────────────────────────────────
    {
        "sender": "noreply@paypa1.com",
        "receiver": "victim@gmail.com",
        "subject": "URGENT: Verify your account immediately or it will be suspended",
        "risk_score": 88,
        "risk_level": "High",
        "recommendation": "Do not click any links. Report to IT security immediately.",
        "summary": "Classic urgency-driven phishing email impersonating PayPal with multiple high-severity indicators.",
        "phishing_indicators": [
            {"name": "Urgency Language", "severity": "High", "reason": "Subject contains urgency keyword: 'immediately'."},
            {"name": "Threat Language", "severity": "High", "reason": "Body contains threat keyword: 'account suspended'."},
            {"name": "Lookalike Domain (Typosquatting)", "severity": "High", "reason": "Domain 'paypa1.com' impersonates PayPal."},
            {"name": "Missing Message-ID Header", "severity": "Medium", "reason": "Message-ID header is absent."},
        ],
        "sandbox_indicators": [],
        "attachments": [],
    },
    # ── 3 · URL shortener ────────────────────────────────────────────────────
    {
        "sender": "deals@newsletter.co",
        "receiver": "user@company.com",
        "subject": "Your exclusive offer expires today",
        "risk_score": 52,
        "risk_level": "Medium",
        "recommendation": "Verify sender identity before clicking any links.",
        "summary": "Email contains URL shorteners that obscure the final destination.",
        "phishing_indicators": [
            {"name": "Shortened URL", "severity": "Medium", "reason": "Detected bit.ly link: http://bit.ly/3xFake."},
            {"name": "Urgency Language", "severity": "Medium", "reason": "Body contains 'expires today'."},
        ],
        "sandbox_indicators": [],
        "attachments": [],
    },
    # ── 4 · Dangerous executable attachment ──────────────────────────────────
    {
        "sender": "invoice@billing-service.net",
        "receiver": "accounts@acme.org",
        "subject": "Invoice #INV-2026-4421 – Action Required",
        "risk_score": 95,
        "risk_level": "High",
        "recommendation": "DELETE immediately. Do NOT open the attachment.",
        "summary": "Email with a disguised executable attachment masquerading as an invoice.",
        "phishing_indicators": [
            {"name": "Dangerous Attachment", "severity": "High", "reason": "Attachment 'invoice.exe' has dangerous extension."},
            {"name": "Credential Harvesting", "severity": "High", "reason": "Body contains credential keywords: 'login'."},
        ],
        "sandbox_indicators": [
            {"name": "High Entropy Detected", "severity": "High", "reason": "File entropy is 7.91 – likely packed/encrypted."},
            {"name": "Executable File", "severity": "High", "reason": "File is a PE32 Windows executable."},
        ],
        "attachments": [
            {
                "filename": "invoice.exe",
                "sha256": "a3f5b2c1d4e6f7890123456789abcdef0123456789abcdef0123456789abcdef",
                "mime_type": "application/x-msdownload",
                "entropy": 7.91,
                "size": 204800,
                "risk": "High",
            }
        ],
    },
    # ── 5 · SPF failure ──────────────────────────────────────────────────────
    {
        "sender": "security@microsoft-alerts.xyz",
        "receiver": "admin@corp.com",
        "subject": "Security Alert: Unauthorized Login Detected",
        "risk_score": 79,
        "risk_level": "High",
        "recommendation": "Treat as phishing. Report to your security team.",
        "summary": "Email fails SPF and DKIM validation. Display name spoofs Microsoft.",
        "phishing_indicators": [
            {"name": "SPF Failure", "severity": "High", "reason": "Received-SPF header indicates SPF fail."},
            {"name": "DKIM Failure", "severity": "High", "reason": "DKIM check result: fail."},
            {"name": "Display Name Spoofing", "severity": "High", "reason": "Display name claims 'Microsoft' but address is from 'microsoft-alerts.xyz'."},
            {"name": "Suspicious TLD", "severity": "Medium", "reason": "Domain uses suspicious TLD: .xyz."},
        ],
        "sandbox_indicators": [],
        "attachments": [],
    },
    # ── 6 · Reply-To mismatch ────────────────────────────────────────────────
    {
        "sender": "support@amazon.com",
        "receiver": "customer@example.org",
        "subject": "Your Amazon order has been placed",
        "risk_score": 65,
        "risk_level": "Medium",
        "recommendation": "Do not reply. Verify through the official Amazon website.",
        "summary": "Reply-To header redirects responses to a non-Amazon address.",
        "phishing_indicators": [
            {"name": "Reply-To Domain Mismatch", "severity": "High", "reason": "From domain 'amazon.com' does not match Reply-To domain 'attacker123.net'."},
        ],
        "sandbox_indicators": [],
        "attachments": [],
    },
    # ── 7 · Many URLs ────────────────────────────────────────────────────────
    {
        "sender": "promo@shopping-deals.biz",
        "receiver": "bargain-hunter@mail.com",
        "subject": "Top 10 deals just for you!",
        "risk_score": 38,
        "risk_level": "Low",
        "recommendation": "Exercise caution. Verify links before clicking.",
        "summary": "Mass promotional email with an unusually high number of embedded URLs.",
        "phishing_indicators": [
            {"name": "Excessive Links", "severity": "Medium", "reason": "Email contains 14 URLs, exceeding threshold of 3."},
            {"name": "Suspicious TLD", "severity": "Medium", "reason": "Sender domain uses suspicious TLD: .biz."},
        ],
        "sandbox_indicators": [],
        "attachments": [],
    },
    # ── 8 · Credential harvesting form ──────────────────────────────────────
    {
        "sender": "webmaster@secure-login-verify.tk",
        "receiver": "user@bank.co",
        "subject": "Confirm your banking credentials",
        "risk_score": 97,
        "risk_level": "High",
        "recommendation": "BLOCK sender. Do NOT enter any credentials.",
        "summary": "Highly suspicious email with embedded HTML login form and credential keywords.",
        "phishing_indicators": [
            {"name": "Credential Harvesting", "severity": "High", "reason": "Body contains 'password', 'OTP', 'bank account'."},
            {"name": "Embedded HTML Form", "severity": "High", "reason": "Email body contains an HTML <form> element."},
            {"name": "Password Input in HTML Body", "severity": "High", "reason": "Email contains a password input field."},
            {"name": "Suspicious TLD", "severity": "Medium", "reason": "Domain uses suspicious TLD: .tk."},
            {"name": "IP Address URL", "severity": "High", "reason": "URL uses raw IP: http://192.168.1.100/login."},
        ],
        "sandbox_indicators": [],
        "attachments": [],
    },
    # ── 9 · PDF with embedded JavaScript ───────────────────────────────────
    {
        "sender": "contracts@legal-documents.co",
        "receiver": "cfo@enterprise.io",
        "subject": "Signed Contract – Please Review",
        "risk_score": 74,
        "risk_level": "Medium",
        "recommendation": "Do not open. Forward to security team for analysis.",
        "summary": "PDF attachment contains embedded JavaScript, a known malware delivery vector.",
        "phishing_indicators": [
            {"name": "Dangerous Attachment", "severity": "High", "reason": "Attachment extension .pdf contains active JavaScript."},
        ],
        "sandbox_indicators": [
            {"name": "JavaScript in PDF", "severity": "High", "reason": "PDF contains /JS or /JavaScript stream – common exploit vector."},
            {"name": "High Entropy Detected", "severity": "Medium", "reason": "PDF entropy is 7.23 – possible encoded payload."},
        ],
        "attachments": [
            {
                "filename": "signed_contract.pdf",
                "sha256": "deadbeefcafe0000111122223333444455556666777788889999aaaabbbbcccc",
                "mime_type": "application/pdf",
                "entropy": 7.23,
                "size": 98304,
                "risk": "Medium",
            }
        ],
    },
    # ── 10 · Brand domain mismatch ──────────────────────────────────────────
    {
        "sender": "github-support@gmail.com",
        "receiver": "developer@oss-project.dev",
        "subject": "Action required: your GitHub account will be deleted",
        "risk_score": 81,
        "risk_level": "High",
        "recommendation": "Ignore. Verify account status at github.com directly.",
        "summary": "Spoofs GitHub support using a Gmail address. Threat language detected.",
        "phishing_indicators": [
            {"name": "Brand Domain Mismatch", "severity": "High", "reason": "Sender 'github-support@gmail.com' references 'github' but uses free provider gmail.com."},
            {"name": "Threat Language", "severity": "High", "reason": "Subject contains 'account will be deleted'."},
            {"name": "Urgency Language", "severity": "Medium", "reason": "Body contains 'immediately'."},
        ],
        "sandbox_indicators": [],
        "attachments": [],
    },
]


def seed_sample_scans(db: Session, *, force: bool = False) -> int:
    """
    Insert 10 representative sample scans into the database.

    Args:
        db:    An open SQLAlchemy session.
        force: If True, insert even if scans already exist.
               If False (default), skip seeding when the table is non-empty.

    Returns:
        Number of scans inserted (0 when skipped).
    """
    from app.database.crud import count_scans

    if not force and count_scans(db) > 0:
        logger.info("Database already contains scan records – seeding skipped.")
        return 0

    base_time = datetime.now(timezone.utc) - timedelta(hours=len(_SAMPLE_SCANS))
    inserted = 0

    for i, sample in enumerate(_SAMPLE_SCANS):
        scan_id = str(uuid.uuid4())
        # Build a minimal json_report from the sample data
        report_dict: dict = {
            "scan_id": scan_id,
            "sender": sample["sender"],
            "receiver": sample["receiver"],
            "subject": sample["subject"],
            "risk_score": sample["risk_score"],
            "risk_level": sample["risk_level"],
            "recommendation": sample["recommendation"],
            "summary": sample["summary"],
            "phishing_indicators": sample["phishing_indicators"],
            "sandbox_indicators": sample["sandbox_indicators"],
            "attachments": sample["attachments"],
        }
        save_full_scan(
            db,
            scan_id=scan_id,
            sender=sample["sender"],
            receiver=sample["receiver"],
            subject=sample["subject"],
            risk_score=sample["risk_score"],
            risk_level=sample["risk_level"],
            recommendation=sample["recommendation"],
            summary=sample["summary"],
            phishing_indicators=sample["phishing_indicators"],
            sandbox_indicators=sample["sandbox_indicators"],
            attachments=sample["attachments"],
            json_report=report_dict,
        )
        inserted += 1
        logger.debug("Seeded scan %d/%d: scan_id=%s", i + 1, len(_SAMPLE_SCANS), scan_id)

    db.commit()
    logger.info("Seeded %d sample scan(s) into the database.", inserted)
    return inserted
