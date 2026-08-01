"""
routes/risk.py
--------------
FastAPI router for the Phase 5 Explainable Risk Scoring Engine API.

Endpoint:
    POST /api/v1/risk/analyze

This router consolidates inputs from Phase 2 (Parsed Email), Phase 3 (Phishing
Engine), and Phase 4 (Static Sandbox Engine) to return a unified risk score,
risk classification level (LOW, MEDIUM, HIGH, CRITICAL), Attack Path reconstruction,
actionable recommendations, and a deterministic Explainable AI (XAI) summary.
"""

from __future__ import annotations

import logging
from fastapi import APIRouter, HTTPException, status

from app.schemas.risk import RiskAnalyzeRequest, RiskAnalyzeResponse
from app.services.risk_engine import calculate_risk

logger = logging.getLogger("app.routes.risk")

router = APIRouter(prefix="/risk", tags=["Explainable Risk Engine"])


@router.post(
    "/analyze",
    response_model=RiskAnalyzeResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze combined email, phishing, and sandbox signals into a unified risk report",
    description=(
        "Accepts optional inputs from **Phase 2** (parsed email object), "
        "**Phase 3** (phishing engine output), and **Phase 4** (sandbox static analysis report).\n\n"
        "### Processing Steps\n"
        "1. **Indicator Merging**: Consolidates indicators across header spoofing, urgency, URL threat, and attachment static analysis.\n"
        "2. **Weighted Scoring**: Applies deterministic rule weights (e.g. Critical Malware=40, Macro=25, Credential Theft=20, Urgency=10) clamped to [0, 100].\n"
        "3. **Risk Level Classification**: Maps score to **LOW** (0-24), **MEDIUM** (25-49), **HIGH** (50-74), or **CRITICAL** (75-100).\n"
        "4. **Attack Path Construction**: Builds a 5-stage cyber attack lifecycle chain (Initial Access → Defense Evasion → Credential Theft → Malware Execution → Persistence).\n"
        "5. **Explainable AI (XAI)**: Generates a plain-English deterministic explanation of why the risk level was assigned without using any external LLM APIs.\n"
        "6. **Actionable Recommendations**: Returns prioritized security recommendations for SOC analysts and end users."
    ),
    responses={
        200: {
            "description": "Risk assessment completed successfully.",
            "content": {
                "application/json": {
                    "example": {
                        "status": "success",
                        "risk_score": 85,
                        "risk_level": "CRITICAL",
                        "reasons": [
                            "[HIGH] Urgency Language: Email subject contains urgency keyword: 'URGENT'",
                            "[HIGH] Lookalike Domain (Typosquatting): Domain paypal-verify.com impersonates PayPal",
                            "[HIGH] Office Macro Detected: VBA macro detected in attachment"
                        ],
                        "recommendations": [
                            "Quarantine or delete this email immediately.",
                            "Report this message to your Security Operations Center (SOC) or IT Security team.",
                            "Do not open, execute, or download any attachments associated with this email."
                        ],
                        "attack_path": [
                            {
                                "stage": "Initial Access",
                                "reason": "Phishing Email with Psychological Urgency/Threat Language; Impersonated Sender Identity / Lookalike Domain"
                            },
                            {
                                "stage": "Malware Execution",
                                "reason": "VBA Macro Attachment Execution"
                            }
                        ],
                        "summary": "This email containing attachment 'invoice_update.docm' is classified as CRITICAL RISK (Score: 85/100) because it exhibits key security indicators including urgency language, lookalike domain (typosquatting) and office macro detected. Opening the attachment could execute unauthorized code or malware on your system."
                    }
                }
            },
        },
        422: {
            "description": "Request body failed Pydantic validation.",
        },
        500: {
            "description": "Internal server error during risk analysis.",
        },
    },
)
async def analyze_risk(payload: RiskAnalyzeRequest) -> RiskAnalyzeResponse:
    """
    Unified Risk Engine Endpoint.

    Processes combined input signals from Phase 2, Phase 3, and Phase 4.
    Returns the aggregated risk score, classification level, reasons, attack path,
    recommendations, and XAI summary.
    """
    logger.info("Unified risk analysis request received.")

    try:
        response = calculate_risk(payload)
        return response
    except Exception as exc:
        logger.error("Unexpected error during risk analysis: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal server error occurred during risk analysis. Please try again.",
        ) from exc
