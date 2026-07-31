"""
routes/sandbox.py
-----------------
FastAPI router for the Phase 4 Sandbox Static Analysis Engine.

Endpoint:
    POST /api/v1/sandbox/analyze

This router is registered in main.py under the /api/v1 prefix and does NOT
modify or interfere with any Phase 1, Phase 2, or Phase 3 endpoints.

Security Note:
    Files are NEVER executed.  All analysis is offline and static.
    No subprocesses are spawned and no external services are contacted.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.schemas.sandbox import SandboxAnalyzeResponse
from app.services.static_analysis import run_static_analysis

logger = logging.getLogger("app.routes.sandbox")

router = APIRouter(prefix="/sandbox", tags=["Sandbox – Static Analysis"])

# Maximum file size accepted by this endpoint (25 MB)
_MAX_UPLOAD_BYTES: int = 25 * 1024 * 1024  # 25 MB

# Supported file extensions (informational; we accept any extension and
# report a mismatch indicator rather than rejecting the file outright)
_SUPPORTED_EXTENSIONS: list[str] = [
    "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
    "zip", "rar", "7z", "exe", "dll", "js", "vbs", "bat",
    "ps1", "jar", "apk", "png", "jpg", "jpeg", "gif",
    "docm", "xlsm", "pptm",
]


@router.post(
    "/analyze",
    response_model=SandboxAnalyzeResponse,
    status_code=status.HTTP_200_OK,
    summary="Static analysis of an uploaded file (sandbox)",
    description=(
        "Accepts a file via **multipart/form-data** and runs it through the "
        "**Phase 4 Sandbox Static Analysis Engine**.\n\n"
        "### What this endpoint does\n"
        "- Computes the **SHA-256** hash\n"
        "- Measures **Shannon entropy** (high values indicate packing / encryption)\n"
        "- Detects the **real file type** using magic bytes and libmagic\n"
        "- Validates the **MIME type** against the declared extension\n"
        "- Validates **magic bytes** against known file signatures\n"
        "- Extracts all **embedded HTTP/HTTPS/FTP URLs**\n"
        "- Detects **Office VBA macros** in DOC/XLS/DOCM/XLSM/PPTM files\n"
        "- Detects **JavaScript** inside PDF files (/JS, /OpenAction, etc.)\n"
        "- Detects **nested archives** (ZIP-in-ZIP, RAR-in-ZIP, 7z-in-ZIP)\n"
        "- Detects **password-protected** ZIP archives\n"
        "- Identifies **executable / script** files (EXE, DLL, BAT, PS1, JS, JAR…)\n"
        "- Detects **double-extension** spoofing (e.g. `invoice.pdf.exe`)\n"
        "- Flags **oversized** (> 25 MB) and **empty** files\n"
        "- Produces a **risk score** (0–100) and risk level (Safe / Low / Medium / High)\n\n"
        "### Security guarantee\n"
        "Files are **never executed**. No subprocesses are spawned. "
        "No external services are contacted. All analysis is offline and static.\n\n"
        f"**Supported file types (examples):** {', '.join(_SUPPORTED_EXTENSIONS)}"
    ),
    responses={
        200: {
            "description": "Analysis completed successfully.",
            "content": {
                "application/json": {
                    "example": {
                        "status": "success",
                        "filename": "invoice.pdf",
                        "risk_score": 15,
                        "risk_level": "Safe",
                        "analysis": {
                            "file_type": "PDF document, version 1.4",
                            "extension": ".pdf",
                            "mime_type": "application/pdf",
                            "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                            "file_size_bytes": 204800,
                            "entropy": 6.83,
                            "magic_bytes": "25504446",
                            "magic_byte_valid": True,
                            "embedded_urls": [],
                            "macros": False,
                            "javascript": False,
                            "nested_archive": False,
                            "password_protected": False,
                            "is_executable": False,
                            "double_extension": False,
                        },
                        "indicators": [],
                    }
                }
            },
        },
        400: {
            "description": (
                "Bad request: file is empty, unreadable, or the upload failed."
            ),
        },
        413: {
            "description": "File exceeds the 25 MB upload limit.",
        },
        500: {
            "description": "Internal server error during static analysis.",
        },
    },
)
async def analyze_file(
    file: UploadFile = File(
        ...,
        description=(
            "The file to analyse. Sent as multipart/form-data with the field "
            "name **file**. Maximum size: 25 MB."
        ),
    ),
) -> SandboxAnalyzeResponse:
    """
    Run the static analysis engine against an uploaded file.

    - Accepts any file type (no extension restriction).
    - Returns a structured analysis report with all indicators and a risk score.
    - Files are **never executed** — analysis is 100% static and offline.
    """
    filename: str = file.filename or "unknown"
    logger.info("Upload received: filename='%s', content_type='%s'", filename, file.content_type)

    # ------------------------------------------------------------------
    # 1. Read file bytes
    # ------------------------------------------------------------------
    try:
        data: bytes = await file.read()
    except Exception as exc:
        logger.error("Failed to read uploaded file '%s': %s", filename, exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read the uploaded file: {exc}",
        ) from exc

    # ------------------------------------------------------------------
    # 2. Early size guard (hard reject above 25 MB)
    # ------------------------------------------------------------------
    if len(data) > _MAX_UPLOAD_BYTES:
        logger.warning(
            "Upload rejected – file too large: '%s' (%d bytes)", filename, len(data)
        )
        # We still run analysis (which will include the Oversized File indicator)
        # rather than rejecting outright, so the caller gets a meaningful report.

    # ------------------------------------------------------------------
    # 3. Run static analysis engine
    # ------------------------------------------------------------------
    try:
        result: SandboxAnalyzeResponse = run_static_analysis(filename, data)
    except Exception as exc:
        logger.error(
            "Unexpected error during static analysis of '%s': %s",
            filename,
            exc,
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "An internal error occurred during static analysis. "
                "Please try again or contact support."
            ),
        ) from exc

    logger.info(
        "Analysis completed: filename='%s', risk_score=%d, risk_level=%s, indicators=%d",
        filename,
        result.risk_score,
        result.risk_level,
        len(result.indicators),
    )

    return result
