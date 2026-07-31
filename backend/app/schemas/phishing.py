"""
schemas/phishing.py
-------------------
Pydantic request/response models for the Phishing Detection API (Phase 3).

These schemas are intentionally decoupled from Phase 2 schemas so the
/phishing/analyze endpoint can be called independently (e.g. Swagger, curl,
integration tests) without requiring a prior file upload.
"""

from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field


# ── Severity ──────────────────────────────────────────────────────────────────

SeverityLevel = Literal["Low", "Medium", "High"]


# ── Request ───────────────────────────────────────────────────────────────────

class AttachmentInput(BaseModel):
    """Minimal attachment descriptor accepted by the phishing engine."""

    filename: Optional[str] = Field(
        None,
        description="Filename of the attachment, e.g. 'invoice.exe'",
        examples=["invoice.exe"],
    )
    content_type: Optional[str] = Field(
        None,
        description="MIME content type, e.g. 'application/octet-stream'",
    )
    extension: Optional[str] = Field(
        None,
        description="File extension including the dot, e.g. '.exe'",
        examples=[".exe"],
    )
    size: Optional[int] = Field(
        None,
        description="Attachment size in bytes",
        ge=0,
    )
    inline: Optional[bool] = Field(
        False,
        description="True if the attachment is embedded/inline",
    )


class PhishingAnalyzeRequest(BaseModel):
    """
    Parsed email payload accepted by POST /api/v1/phishing/analyze.

    This mirrors the ``ParsedEmail`` schema returned by Phase 2 so the
    caller can pipe the upload response directly into this endpoint.
    All fields are optional; the engine gracefully handles absent data.
    """

    sender: Optional[str] = Field(
        None,
        description="From header value (may include display name)",
        examples=["PayPal Support <support@paypa1.com>"],
    )
    receiver: Optional[str] = Field(
        None,
        description="To header value",
        examples=["user@gmail.com"],
    )
    subject: Optional[str] = Field(
        None,
        description="Email subject line",
        examples=["Urgent! Verify your account immediately"],
    )
    date: Optional[str] = Field(
        None,
        description="Date header value",
    )
    reply_to: Optional[str] = Field(
        None,
        description="Reply-To header value",
        examples=["attacker@evil.com"],
    )
    return_path: Optional[str] = Field(
        None,
        description="Return-Path header value",
    )
    message_id: Optional[str] = Field(
        None,
        description="Message-ID header value",
    )
    mime_version: Optional[str] = Field(
        None,
        description="MIME-Version header value",
    )
    headers: Dict[str, Any] = Field(
        default_factory=dict,
        description="All raw email headers as a flat key-value dict",
    )
    body_text: str = Field(
        "",
        description="Plain-text body of the email",
    )
    body_html: str = Field(
        "",
        description="HTML body of the email",
    )
    urls: List[str] = Field(
        default_factory=list,
        description="List of URLs extracted from the email body",
    )
    attachments: List[AttachmentInput] = Field(
        default_factory=list,
        description="List of attachment descriptors",
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "sender": "PayPal Support <support@paypa1.com>",
                    "receiver": "user@gmail.com",
                    "subject": "Urgent! Verify your account immediately",
                    "reply_to": "attacker@evil.com",
                    "message_id": None,
                    "date": "Thu, 31 Jul 2026 10:00:00 +0000",
                    "headers": {"Received-SPF": "fail"},
                    "body_text": "Click here immediately to avoid account suspension.",
                    "body_html": "",
                    "urls": ["http://bit.ly/abcd", "http://192.168.1.1/login"],
                    "attachments": [{"filename": "invoice.exe", "extension": ".exe", "size": 40960}],
                }
            ]
        }
    }


# ── Response ──────────────────────────────────────────────────────────────────

class PhishingIndicator(BaseModel):
    """A single phishing indicator detected by the rule engine."""

    name: str = Field(
        ...,
        description="Short, human-readable name of the detection rule",
        examples=["Urgency Language"],
    )
    severity: SeverityLevel = Field(
        ...,
        description="Risk severity: Low | Medium | High",
        examples=["High"],
    )
    reason: str = Field(
        ...,
        description="Detailed explanation of why this rule triggered",
        examples=["Email subject contains urgency keyword: 'immediately'"],
    )


class PhishingAnalyzeResponse(BaseModel):
    """API response for POST /api/v1/phishing/analyze."""

    status: str = Field(
        "success",
        description="Always 'success' on a 200 response",
    )
    indicator_count: int = Field(
        ...,
        description="Total number of phishing indicators detected",
        ge=0,
    )
    risk_level: SeverityLevel = Field(
        ...,
        description="Overall risk level derived from the highest-severity indicator",
    )
    indicators: List[PhishingIndicator] = Field(
        ...,
        description="Ordered list of all detected phishing indicators",
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "status": "success",
                    "indicator_count": 3,
                    "risk_level": "High",
                    "indicators": [
                        {
                            "name": "Urgency Language",
                            "severity": "High",
                            "reason": "Email subject contains urgency keyword: 'immediately'",
                        },
                        {
                            "name": "Shortened URL",
                            "severity": "Medium",
                            "reason": "Detected URL shortener domain: bit.ly",
                        },
                        {
                            "name": "SPF Failure",
                            "severity": "High",
                            "reason": "Received-SPF header indicates SPF fail.",
                        },
                    ],
                }
            ]
        }
    }
