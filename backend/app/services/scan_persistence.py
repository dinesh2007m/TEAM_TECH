"""
services/scan_persistence.py
-----------------------------
Auto-save service for TEAM_TECH.

Called automatically after every successful scan.  Accepts the outputs of
Phase 2 (parsed email), Phase 3 (phishing analysis), and optionally Phase 4
(sandbox analysis) and persists them atomically to SQLite via the CRUD layer.

Usage in a route handler::

    from app.services.scan_persistence import persist_scan

    # after phishing analysis completes
    persist_scan(
        scan_id       = upload_response.email_id,
        parsed_email  = upload_response.parsed_email,   # Phase 2
        phishing_resp = phishing_response,              # Phase 3
        sandbox_resp  = None,                           # Phase 4 (optional)
    )

The function is deliberately synchronous so it can be used as a FastAPI
BackgroundTask OR called directly in a try/except block.  Database errors
are caught and logged — they never propagate to the caller so the API
response is never affected by a persistence failure.
"""

from __future__ import annotations

import json
import logging
from typing import Any, Optional

from app.database.crud import save_full_scan
from app.database.database import SessionLocal

logger = logging.getLogger("app.services.scan_persistence")

# ── Risk level → numeric score (when sandbox score is absent) ─────────────────
_RISK_SCORE_MAP: dict[str, int] = {
    "Low":    20,
    "Medium": 55,
    "High":   85,
    "Safe":    0,
}


def _indicators_to_dicts(indicators: Any) -> list[dict]:
    """
    Convert a list of PhishingIndicator / SandboxIndicator Pydantic objects
    (or plain dicts) to plain dicts for CRUD insertion.
    """
    result: list[dict] = []
    for ind in (indicators or []):
        if isinstance(ind, dict):
            result.append(ind)
        else:
            # Pydantic model — use model_dump() (v2) or dict() (v1)
            try:
                result.append(ind.model_dump())
            except AttributeError:
                result.append(ind.dict())
    return result


def _attachments_to_dicts(attachments: Any, sandbox_resp: Any = None) -> list[dict]:
    """
    Merge attachment metadata from Phase 2 and Phase 4 sandbox results.

    Phase 2 provides: filename, content_type, extension, size, inline
    Phase 4 provides: sha256, entropy, mime_type, risk_level

    For now we only persist Phase 2 attachments; Phase 4 results are stored as
    sandbox indicators.  This keeps the function simple and extensible.
    """
    result: list[dict] = []
    for att in (attachments or []):
        if isinstance(att, dict):
            d = dict(att)
        else:
            try:
                d = att.model_dump()
            except AttributeError:
                d = att.dict()

        # Normalise keys that differ between Phase 2 and Phase 4
        d.setdefault("mime_type", d.pop("content_type", None))
        result.append(d)
    return result


def _derive_risk_score(phishing_resp: Any, sandbox_resp: Any) -> tuple[int, str]:
    """
    Derive a combined risk_score (0-100) and risk_level string.

    Priority: sandbox risk_score (0-100) > phishing risk_level mapping.
    """
    p_level = phishing_resp.get("risk_level", "Low") if isinstance(phishing_resp, dict) else getattr(phishing_resp, "risk_level", "Low")
    
    # Try sandbox first (has a numeric score)
    if sandbox_resp is not None:
        score = sandbox_resp.get("risk_score") if isinstance(sandbox_resp, dict) else getattr(sandbox_resp, "risk_score", None)
        level = sandbox_resp.get("risk_level") if isinstance(sandbox_resp, dict) else getattr(sandbox_resp, "risk_level", None)
        if score is not None:
            phishing_score = _RISK_SCORE_MAP.get(str(p_level), 20)
            combined = max(int(score), phishing_score)
            if combined >= 75:
                level = "High"
            elif combined >= 50:
                level = "Medium"
            elif combined >= 20:
                level = "Low"
            else:
                level = "Safe"
            return combined, str(level)

    # Phishing-only
    phishing_level_str = str(p_level)
    return _RISK_SCORE_MAP.get(phishing_level_str, 20), phishing_level_str


def _build_recommendation(risk_level: str, indicator_count: int) -> str:
    """Generate a short recommendation string based on risk level."""
    if risk_level == "High":
        return (
            "This email shows strong phishing signals. "
            "Do NOT click links or open attachments. "
            "Report to your IT security team immediately."
        )
    if risk_level == "Medium":
        return (
            "This email contains suspicious elements. "
            "Verify the sender's identity through an independent channel before taking any action."
        )
    if risk_level == "Low":
        return (
            "Minor anomalies detected. "
            "Exercise caution and verify any unexpected requests."
        )
    return "No phishing signals detected. Email appears legitimate."


def _build_summary(
    phishing_resp: Any,
    sandbox_resp: Any,
    risk_level: str,
) -> str:
    """Build a short narrative summary of the scan result."""
    if isinstance(phishing_resp, dict):
        phishing_count = len(phishing_resp.get("indicators", []))
    else:
        phishing_count = len(getattr(phishing_resp, "indicators", []) or [])

    if sandbox_resp:
        if isinstance(sandbox_resp, dict):
            sandbox_count = len(sandbox_resp.get("indicators", []))
        else:
            sandbox_count = len(getattr(sandbox_resp, "indicators", []) or [])
    else:
        sandbox_count = 0

    parts: list[str] = []
    if phishing_count:
        parts.append(f"{phishing_count} phishing indicator(s) detected")
    if sandbox_count:
        parts.append(f"{sandbox_count} sandbox indicator(s) detected")
    if not parts:
        parts.append("No suspicious indicators found")

    return f"[{risk_level}] " + "; ".join(parts) + "."


def persist_scan(
    *,
    scan_id: str,
    parsed_email: Any,
    phishing_resp: Any,
    sandbox_resp: Any = None,
) -> None:
    """
    Persist a completed scan to SQLite.

    This function is safe to call from any context — it opens its own
    database session and always closes it.  All exceptions are caught and
    logged; they never propagate to the caller.

    Args:
        scan_id:      The email UUID from Phase 2.
        parsed_email: The parsed_email object/dict from Phase 2.
        phishing_resp: PhishingAnalyzeResponse from Phase 3.
        sandbox_resp:  SandboxAnalyzeResponse from Phase 4 (optional).
    """
    try:
        # ── Normalise parsed_email ─────────────────────────────────────────
        if isinstance(parsed_email, dict):
            pe = parsed_email
        else:
            try:
                pe = parsed_email.model_dump()
            except AttributeError:
                pe = parsed_email.dict() if hasattr(parsed_email, "dict") else {}

        sender   = pe.get("sender")
        receiver = pe.get("receiver")
        subject  = pe.get("subject")

        # ── Risk aggregation ───────────────────────────────────────────────
        if isinstance(phishing_resp, dict):
            p_indicators_raw = phishing_resp.get("indicators", [])
            p_risk_level = phishing_resp.get("risk_level", "Low")
        else:
            p_indicators_raw = getattr(phishing_resp, "indicators", [])
            p_risk_level = getattr(phishing_resp, "risk_level", "Low")

        if isinstance(sandbox_resp, dict):
            s_indicators_raw = sandbox_resp.get("indicators", [])
            s_risk_score = sandbox_resp.get("risk_score")
            s_risk_level = sandbox_resp.get("risk_level")
        else:
            s_indicators_raw = getattr(sandbox_resp, "indicators", []) if sandbox_resp else []
            s_risk_score = getattr(sandbox_resp, "risk_score", None) if sandbox_resp else None
            s_risk_level = getattr(sandbox_resp, "risk_level", None) if sandbox_resp else None

        risk_score, risk_level = _derive_risk_score(phishing_resp, sandbox_resp)
        recommendation = _build_recommendation(risk_level, len(p_indicators_raw))
        summary        = _build_summary(phishing_resp, sandbox_resp, risk_level)

        # ── Indicators ─────────────────────────────────────────────────────
        phishing_indicators = _indicators_to_dicts(p_indicators_raw)
        sandbox_indicators  = _indicators_to_dicts(s_indicators_raw)

        # ── Attachments ────────────────────────────────────────────────────
        attachments = _attachments_to_dicts(pe.get("attachments", []), sandbox_resp)

        # ── Build full JSON report ─────────────────────────────────────────
        json_report: dict = {
            "scan_id":              scan_id,
            "sender":               sender,
            "receiver":             receiver,
            "subject":              subject,
            "risk_score":           risk_score,
            "risk_level":           risk_level,
            "recommendation":       recommendation,
            "summary":              summary,
            "phishing_indicators":  phishing_indicators,
            "sandbox_indicators":   sandbox_indicators,
            "attachments":          attachments,
        }

        # ── Persist ────────────────────────────────────────────────────────
        db = SessionLocal()
        try:
            save_full_scan(
                db,
                scan_id=scan_id,
                sender=sender,
                receiver=receiver,
                subject=subject,
                risk_score=risk_score,
                risk_level=risk_level,
                recommendation=recommendation,
                summary=summary,
                phishing_indicators=phishing_indicators,
                sandbox_indicators=sandbox_indicators,
                attachments=attachments,
                json_report=json_report,
            )
            db.commit()
            logger.info(
                "Scan persisted: scan_id=%s risk=%s score=%d indicators=%d",
                scan_id,
                risk_level,
                risk_score,
                len(phishing_indicators) + len(sandbox_indicators),
            )
        except Exception as db_exc:
            db.rollback()
            logger.error(
                "Database commit failed for scan_id=%s: %s",
                scan_id,
                db_exc,
                exc_info=True,
            )
        finally:
            db.close()

    except Exception as exc:
        # Never crash the API because of a persistence failure
        logger.error(
            "persist_scan failed unexpectedly for scan_id=%s: %s",
            scan_id,
            exc,
            exc_info=True,
        )
