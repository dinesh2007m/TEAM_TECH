"""
routes/phishing.py
------------------
FastAPI router for the Phishing Detection API (Phase 3).

Endpoint:
    POST /api/v1/phishing/analyze

This route is registered in main.py under the /api/v1 prefix and does NOT
affect or share state with any Phase 1 or Phase 2 endpoints.
"""

import logging
from fastapi import APIRouter, BackgroundTasks, HTTPException, status

from app.schemas.phishing import (
    PhishingAnalyzeRequest,
    PhishingAnalyzeResponse,
    SeverityLevel,
)
from app.services.phishing_detector import run_detection, _overall_risk
from app.services.scan_persistence import persist_scan

logger = logging.getLogger("app.routes.phishing")

router = APIRouter(prefix="/phishing", tags=["Phishing Detection"])


@router.post(
    "/analyze",
    response_model=PhishingAnalyzeResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze a parsed email for phishing indicators",
    description=(
        "Accepts the parsed email structure returned by the Phase 2 "
        "**POST /api/v1/upload/email** endpoint (or any compatible JSON object) "
        "and runs it through the rule-based phishing detection engine.\n\n"
        "Returns a list of phishing indicators — each with a **name**, **severity** "
        "(Low / Medium / High), and human-readable **reason** — plus an overall "
        "**risk_level** and the total **indicator_count**.\n\n"
        "**No machine learning is used.** All detection is deterministic and "
        "rule-based, making results fully reproducible and auditable."
    ),
    responses={
        200: {
            "description": "Detection completed successfully. Indicators list may be empty for clean emails.",
            "content": {
                "application/json": {
                    "example": {
                        "status": "success",
                        "indicator_count": 2,
                        "risk_level": "High",
                        "indicators": [
                            {
                                "name": "Urgency Language",
                                "severity": "High",
                                "reason": "Email subject contains urgency keyword(s): 'immediately'.",
                            },
                            {
                                "name": "Shortened URL",
                                "severity": "Medium",
                                "reason": "Detected 1 URL shortener link(s): http://bit.ly/abcd (bit.ly).",
                            },
                        ],
                    }
                }
            },
        },
        422: {
            "description": "Request body failed Pydantic validation.",
        },
        500: {
            "description": "Internal server error during phishing analysis.",
        },
    },
)
async def analyze_email(
    payload: PhishingAnalyzeRequest,
    background_tasks: BackgroundTasks,
) -> PhishingAnalyzeResponse:
    """
    Run the phishing detection engine against a parsed email payload.

    - Accepts the full parsed email JSON from Phase 2 directly.
    - All fields are optional; the engine handles partial data gracefully.
    - Returns an empty ``indicators`` list when no phishing signals are found.
    """
    logger.info(
        "Phishing analysis request received | sender=%s | subject=%s",
        payload.sender,
        payload.subject,
    )

    try:
        indicators = run_detection(payload)
    except Exception as exc:
        logger.error("Unexpected error during phishing detection: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal error occurred during phishing analysis. Please try again.",
        ) from exc

    risk: SeverityLevel = _overall_risk(indicators)

    logger.info(
        "Phishing analysis complete | indicator_count=%d | risk_level=%s",
        len(indicators),
        risk,
    )

    import uuid as _uuid
    _scan_id = payload.scan_id or payload.email_id or str(_uuid.uuid4())

    response = PhishingAnalyzeResponse(
        status="success",
        scan_id=_scan_id,
        indicator_count=len(indicators),
        risk_level=risk,
        indicators=indicators,
    )

    # ── Auto-save: persist the scan to SQLite ─────────────────────────────────
    # Synchronously call persist_scan or use background task to guarantee database save
    try:
        persist_scan(
            scan_id=_scan_id,
            parsed_email=payload,
            phishing_resp=response,
            sandbox_resp=None,
        )
    except Exception as save_err:
        logger.warning(f"Background persist scan exception for {_scan_id}: {save_err}")

    return response
