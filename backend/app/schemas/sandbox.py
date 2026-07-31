"""
schemas/sandbox.py
------------------
Pydantic v2 request / response models for the Phase 4
Sandbox Static Analysis Engine.

All models are immutable (frozen), fully typed, and include
JSON schema examples that are surfaced in Swagger UI.
"""

from __future__ import annotations

from enum import Enum
from typing import List

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Enumerations
# ---------------------------------------------------------------------------

class SeverityLevel(str, Enum):
    """Severity levels for individual indicators."""

    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"


class RiskLevel(str, Enum):
    """Overall risk level derived from the risk score (0-100)."""

    SAFE = "Safe"
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"


# ---------------------------------------------------------------------------
# Sub-models
# ---------------------------------------------------------------------------

class SandboxIndicator(BaseModel):
    """A single detection indicator produced by a static-analysis rule."""

    name: str = Field(
        ...,
        description="Short, human-readable name that identifies the rule that fired.",
        examples=["High Entropy Detected"],
    )
    severity: SeverityLevel = Field(
        ...,
        description="Severity level of this indicator (Low / Medium / High).",
        examples=["High"],
    )
    reason: str = Field(
        ...,
        description="Human-readable explanation of why this indicator was raised.",
        examples=["File entropy is 7.85 (> 7.2). Possible packed or encrypted content."],
    )

    model_config = {"frozen": True}


class FileAnalysis(BaseModel):
    """
    Structured static-analysis report.

    Every field has a sensible default so that partial results can still be
    returned even when a specific analysis step fails.
    """

    file_type: str = Field(
        default="Unknown",
        description="Human-readable file type label (e.g. 'PDF', 'ZIP', 'PE32 executable').",
        examples=["PDF"],
    )
    extension: str = Field(
        default="",
        description="File extension as declared in the filename (e.g. '.pdf').",
        examples=[".pdf"],
    )
    mime_type: str = Field(
        default="application/octet-stream",
        description="MIME type detected from file content (libmagic or stdlib fallback).",
        examples=["application/pdf"],
    )
    sha256: str = Field(
        default="",
        description="SHA-256 hex digest of the raw file bytes.",
        examples=["e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"],
    )
    file_size_bytes: int = Field(
        default=0,
        description="Raw file size in bytes.",
        examples=[204800],
    )
    entropy: float = Field(
        default=0.0,
        description="Shannon entropy of the file content (0.0 to 8.0).",
        examples=[6.83],
    )
    magic_bytes: str = Field(
        default="",
        description="Hex-encoded first 8 bytes of the file (magic number).",
        examples=["25504446"],
    )
    magic_byte_valid: bool = Field(
        default=True,
        description="True if the magic bytes match the declared file extension.",
        examples=[True],
    )
    embedded_urls: List[str] = Field(
        default_factory=list,
        description="All HTTP/HTTPS/FTP URLs found embedded in the file content.",
        examples=[["https://evil.example.com/payload"]],
    )
    macros: bool = Field(
        default=False,
        description="True when VBA macros or a vbaProject.bin stream are detected.",
        examples=[False],
    )
    javascript: bool = Field(
        default=False,
        description="True when JavaScript is detected inside a PDF (/JS, /JavaScript, /OpenAction).",
        examples=[True],
    )
    nested_archive: bool = Field(
        default=False,
        description="True when the file is an archive that contains another archive.",
        examples=[False],
    )
    password_protected: bool = Field(
        default=False,
        description="True when the archive appears to be password-protected.",
        examples=[False],
    )
    is_executable: bool = Field(
        default=False,
        description="True when the file is or resembles an executable (EXE, DLL, BAT, PS1, etc.).",
        examples=[False],
    )
    double_extension: bool = Field(
        default=False,
        description="True when the filename contains a suspicious double extension.",
        examples=[False],
    )

    model_config = {"frozen": True}


# ---------------------------------------------------------------------------
# Top-level response
# ---------------------------------------------------------------------------

class SandboxAnalyzeResponse(BaseModel):
    """
    Full response returned by **POST /api/v1/sandbox/analyze**.

    Combines a structured :class:`FileAnalysis` block with a flat list of
    :class:`SandboxIndicator` objects and an aggregated risk score / level.
    """

    status: str = Field(
        default="success",
        description="Always 'success' on a 200 OK response.",
        examples=["success"],
    )
    filename: str = Field(
        ...,
        description="Original filename supplied by the client.",
        examples=["invoice.pdf"],
    )
    risk_score: int = Field(
        ...,
        ge=0,
        le=100,
        description=(
            "Aggregated risk score in the range 0-100. "
            "Safe: 0-20 | Low: 20-50 | Medium: 50-75 | High: 75-100."
        ),
        examples=[82],
    )
    risk_level: RiskLevel = Field(
        ...,
        description="Human-readable risk band derived from risk_score.",
        examples=["High"],
    )
    analysis: FileAnalysis = Field(
        ...,
        description="Detailed per-property analysis results.",
    )
    indicators: List[SandboxIndicator] = Field(
        default_factory=list,
        description="Ordered list of triggered detection indicators.",
    )

    model_config = {"frozen": True}
