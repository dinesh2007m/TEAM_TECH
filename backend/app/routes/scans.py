"""
routes/scans.py
---------------
FastAPI router for Scans and Risk Analysis.

Endpoints:
    POST /api/v1/scan          – Unified 1-click complete scan (.eml upload -> parse -> phishing -> sandbox -> auto-save SQLite)
    POST /api/v1/risk/analyze   – Risk scoring and attack path analysis endpoint
"""

import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, File, UploadFile, HTTPException, status, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.config.settings import MAX_FILE_SIZE_BYTES, ALLOWED_EXTENSIONS
from app.services.ingestion import save_email_file, parse_email_content
from app.services.phishing_detector import run_detection, _overall_risk
from app.services.static_analysis import run_static_analysis
from app.services.scoring import calculate_risk_score, generate_attack_path, generate_recommendations
from app.services.scan_persistence import persist_scan
from app.database.database import get_db

logger = logging.getLogger("app.routes.scans")

router = APIRouter(prefix="", tags=["Scans & Risk Analysis"])


# ─────────────────────────────────────────────────────────────────────────────
# Pydantic Schemas
# ─────────────────────────────────────────────────────────────────────────────

class RiskAnalysisRequest(BaseModel):
    sender: Optional[str] = None
    receiver: Optional[str] = None
    subject: Optional[str] = None
    phishing_indicators: List[Dict[str, Any]] = Field(default_factory=list)
    sandbox_indicators: List[Dict[str, Any]] = Field(default_factory=list)


class RiskAnalysisResponse(BaseModel):
    status: str = "success"
    risk_score: int
    risk_level: str
    summary: str
    recommendation: str
    attack_path: List[str]


class CompleteScanResponse(BaseModel):
    status: str = "success"
    scan_id: str
    email_id: str
    parsed_email: Dict[str, Any]
    phishing_analysis: Dict[str, Any]
    sandbox_analysis: Optional[Dict[str, Any]] = None
    risk_analysis: RiskAnalysisResponse
    saved_to_db: bool = True


# ─────────────────────────────────────────────────────────────────────────────
# POST /risk/analyze
# ─────────────────────────────────────────────────────────────────────────────

@router.post(
    "/risk/analyze",
    response_model=RiskAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze risk score, level, summary, and attack path",
)
async def analyze_risk(payload: RiskAnalysisRequest) -> RiskAnalysisResponse:
    score, level = calculate_risk_score(payload.phishing_indicators, payload.sandbox_indicators)
    attack_path = generate_attack_path(payload.sender, payload.subject, payload.phishing_indicators, payload.sandbox_indicators)
    rec = generate_recommendations(level)
    summary = f"[{level}] Risk Score {score}/100. Flagged {len(payload.phishing_indicators)} phishing and {len(payload.sandbox_indicators)} sandbox indicators."

    return RiskAnalysisResponse(
        status="success",
        risk_score=score,
        risk_level=level,
        summary=summary,
        recommendation=rec,
        attack_path=attack_path,
    )


# ─────────────────────────────────────────────────────────────────────────────
# POST /scan
# ─────────────────────────────────────────────────────────────────────────────

@router.post(
    "/scan",
    response_model=CompleteScanResponse,
    status_code=status.HTTP_200_OK,
    summary="Unified 1-Click Complete Scan (.eml upload -> parse -> phishing -> sandbox -> auto-save SQLite)",
)
async def complete_scan(
    file: UploadFile = File(..., description="The .eml file to analyze"),
) -> CompleteScanResponse:
    filename = file.filename or ""
    logger.info(f"Complete scan initiated: filename='{filename}'")

    # 1. Read & Validate
    if not any(filename.lower().endswith(ext) for ext in ALLOWED_EXTENSIONS):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file extension for file '{filename}'. Only .eml files are allowed."
        )

    content = await file.read()
    if not content or len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid or oversized file '{filename}'."
        )

    # 2. Parse Email
    parsed_email_obj = parse_email_content(content)
    email_id, saved_path = save_email_file(content)

    pe_dict = (
        parsed_email_obj.model_dump()
        if hasattr(parsed_email_obj, "model_dump")
        else parsed_email_obj.dict()
        if hasattr(parsed_email_obj, "dict")
        else dict(parsed_email_obj)
    )

    # 3. Phishing Detection
    from app.schemas.phishing import PhishingAnalyzeRequest
    phishing_req = PhishingAnalyzeRequest(
        scan_id=email_id,
        email_id=email_id,
        sender=pe_dict.get("sender"),
        receiver=pe_dict.get("receiver"),
        subject=pe_dict.get("subject"),
        date=pe_dict.get("date"),
        reply_to=pe_dict.get("reply_to"),
        body_text=pe_dict.get("body_text", ""),
        body_html=pe_dict.get("body_html", ""),
        urls=pe_dict.get("urls", []),
        attachments=pe_dict.get("attachments", []),
        headers=pe_dict.get("headers", {}),
    )
    phishing_indicators = run_detection(phishing_req)
    phishing_risk = _overall_risk(phishing_indicators)
    phishing_resp_dict = {
        "status": "success",
        "scan_id": email_id,
        "indicator_count": len(phishing_indicators),
        "risk_level": phishing_risk,
        "indicators": [i.model_dump() if hasattr(i, "model_dump") else i for i in phishing_indicators],
    }

    # 4. Sandbox Static Analysis (on email file)
    sandbox_res = run_static_analysis(filename, content)
    sandbox_dict = sandbox_res.model_dump() if hasattr(sandbox_res, "model_dump") else sandbox_res

    # 5. Risk Analysis
    p_ind_dicts = [i.model_dump() if hasattr(i, "model_dump") else i for i in phishing_indicators]
    s_ind_dicts = [i.model_dump() if hasattr(i, "model_dump") else i for i in getattr(sandbox_res, "indicators", [])]
    
    score, level = calculate_risk_score(p_ind_dicts, s_ind_dicts)
    attack_path = generate_attack_path(pe_dict.get("sender"), pe_dict.get("subject"), p_ind_dicts, s_ind_dicts)
    rec = generate_recommendations(level)
    summary = f"[{level}] Risk Score {score}/100 with {len(p_ind_dicts)} phishing and {len(s_ind_dicts)} sandbox indicators."

    risk_resp = RiskAnalysisResponse(
        status="success",
        risk_score=score,
        risk_level=level,
        summary=summary,
        recommendation=rec,
        attack_path=attack_path,
    )

    # 6. Auto Save to SQLite
    persist_scan(
        scan_id=email_id,
        parsed_email=pe_dict,
        phishing_resp=phishing_resp_dict,
        sandbox_resp=sandbox_res,
    )

    logger.info(f"Complete scan successful and saved to database: scan_id={email_id}")

    return CompleteScanResponse(
        status="success",
        scan_id=email_id,
        email_id=email_id,
        parsed_email=pe_dict,
        phishing_analysis=phishing_resp_dict,
        sandbox_analysis=sandbox_dict,
        risk_analysis=risk_resp,
        saved_to_db=True,
    )
