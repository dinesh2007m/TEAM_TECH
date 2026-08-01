"""
schemas/risk.py
----------------
Pydantic v2 schemas for Phase 5 – Explainable Risk Scoring Engine.

Models for request, sub-structures (attack path, indicators),
and top-level response for POST /api/v1/risk/analyze.
"""

from __future__ import annotations

from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.schemas.email import ParsedEmail
from app.schemas.phishing import PhishingAnalyzeResponse
from app.schemas.sandbox import SandboxAnalyzeResponse


# ---------------------------------------------------------------------------
# Enumerations
# ---------------------------------------------------------------------------

class RiskLevel(str, Enum):
    """
    Final risk levels determined by the weighted risk score:
    - LOW:      0 - 24
    - MEDIUM:  25 - 49
    - HIGH:    50 - 74
    - CRITICAL: 75 - 100
    """

    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


# ---------------------------------------------------------------------------
# Sub-models
# ---------------------------------------------------------------------------

class AttackPathStage(BaseModel):
    """A single stage in the reconstructed attack path sequence."""

    stage: str = Field(
        ...,
        description="Cyber attack lifecycle stage (e.g. 'Initial Access', 'Credential Theft', 'Malware Execution', 'Persistence', 'Defense Evasion').",
        examples=["Initial Access"],
    )
    reason: str = Field(
        ...,
        description="Explanation or trigger associated with this attack stage.",
        examples=["Phishing Email with Urgency Language"],
    )

    model_config = {"frozen": True}


# ---------------------------------------------------------------------------
# Top-level Request Model
# ---------------------------------------------------------------------------

class RiskAnalyzeRequest(BaseModel):
    """
    Combined input payload accepted by POST /api/v1/risk/analyze.

    Accepts parsed email data (Phase 2), phishing detection results (Phase 3),
    and sandbox static analysis results (Phase 4). All fields are optional
    so partial or single-component inputs can be analyzed gracefully.
    """

    parsed_email: Optional[ParsedEmail] = Field(
        default=None,
        description="Parsed email structural data from Phase 2 (upload endpoint).",
    )
    phishing_result: Optional[PhishingAnalyzeResponse] = Field(
        default=None,
        description="Phishing detection results from Phase 3 (phishing analyze endpoint).",
    )
    sandbox_result: Optional[SandboxAnalyzeResponse] = Field(
        default=None,
        description="Sandbox static analysis results from Phase 4 (sandbox analyze endpoint).",
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "parsed_email": {
                        "sender": "billing@paypal-verify.com",
                        "receiver": "victim@company.com",
                        "subject": "URGENT: Account Suspension Notice",
                        "body_text": "Please log in to http://bit.ly/fake-login to restore access.",
                        "urls": ["http://bit.ly/fake-login"]
                    },
                    "phishing_result": {
                        "status": "success",
                        "indicator_count": 3,
                        "risk_level": "High",
                        "indicators": [
                            {
                                "name": "Urgency Language",
                                "severity": "High",
                                "reason": "Subject contains urgency keyword: 'URGENT'"
                            },
                            {
                                "name": "Lookalike Domain (Typosquatting)",
                                "severity": "High",
                                "reason": "Domain paypal-verify.com impersonates PayPal"
                            },
                            {
                                "name": "Shortened URL",
                                "severity": "Medium",
                                "reason": "Detected link shortener: bit.ly"
                            }
                        ]
                    },
                    "sandbox_result": {
                        "status": "success",
                        "filename": "invoice_update.docm",
                        "risk_score": 75,
                        "risk_level": "High",
                        "analysis": {
                            "file_type": "Microsoft Word (DOCM)",
                            "extension": ".docm",
                            "mime_type": "application/vnd.ms-word.document.macroEnabled.12",
                            "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                            "macros": True
                        },
                        "indicators": [
                            {
                                "name": "Office Macro Detected",
                                "severity": "High",
                                "reason": "VBA macro detected in attachment"
                            }
                        ]
                    }
                }
            ]
        }
    }


# ---------------------------------------------------------------------------
# Top-level Response Model
# ---------------------------------------------------------------------------

class RiskAnalyzeResponse(BaseModel):
    """
    Unified report returned by POST /api/v1/risk/analyze.

    Provides a aggregated risk score, standardized risk level,
    human-readable reasons, actionable recommendations, reconstructed attack path,
    and a deterministic explainable summary.
    """

    status: str = Field(
        default="success",
        description="Operation status (always 'success' on 200 OK).",
        examples=["success"],
    )
    risk_score: int = Field(
        ...,
        ge=0,
        le=100,
        description="Final aggregated risk score (0-100, clamped at 100).",
        examples=[85],
    )
    risk_level: RiskLevel = Field(
        ...,
        description="Final risk classification (LOW: 0-24, MEDIUM: 25-49, HIGH: 50-74, CRITICAL: 75-100).",
        examples=[RiskLevel.CRITICAL],
    )
    reasons: List[str] = Field(
        default_factory=list,
        description="Detailed list of specific indicator reasons contributing to the risk score.",
        examples=[
            [
                "Phishing Email containing urgency language.",
                "Spoofed or lookalike sender domain detected.",
                "Malicious Office macro attachment present."
            ]
        ],
    )
    recommendations: List[str] = Field(
        default_factory=list,
        description="Ordered list of recommended security mitigation actions for the user/SOC operator.",
        examples=[
            [
                "Do not open or execute any attachments.",
                "Do not click on embedded links.",
                "Report this incident to the Security Operations Center (SOC)."
            ]
        ],
    )
    attack_path: List[AttackPathStage] = Field(
        default_factory=list,
        description="Reconstructed cyber attack lifecycle stages based on detected indicators.",
    )
    summary: str = Field(
        ...,
        description="Deterministic, human-readable Explainable AI (XAI) verdict summary.",
        examples=[
            "This email is classified as CRITICAL RISK (Score: 85/100) because it combines urgency language, spoofed sender identity, shortened URLs, and a malicious Office macro attachment. Opening the attachment could execute malware."
        ],
    )

    model_config = {"frozen": True}
