"""
services/risk_engine.py
------------------------
Phase 5 – Explainable Risk Scoring Engine.

Combines results from Phase 2 (Parsed Email), Phase 3 (Phishing Engine),
and Phase 4 (Static Sandbox Engine) to calculate a unified risk score (0-100),
assign a risk level (LOW, MEDIUM, HIGH, CRITICAL), construct an Attack Path,
generate actionable security recommendations, and output a deterministic
Explainable AI (XAI) summary.

Deterministic & Rule-Based Only (No Machine Learning, No LLM API calls).
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Set, Tuple

from app.schemas.email import ParsedEmail
from app.schemas.phishing import PhishingAnalyzeResponse, PhishingIndicator
from app.schemas.sandbox import SandboxAnalyzeResponse, SandboxIndicator
from app.schemas.risk import (
    AttackPathStage,
    RiskAnalyzeRequest,
    RiskAnalyzeResponse,
    RiskLevel,
)

logger = logging.getLogger("app.services.risk_engine")

# ---------------------------------------------------------------------------
# Rule Weights Lookup Table
# ---------------------------------------------------------------------------

INDICATOR_WEIGHTS: Dict[str, int] = {
    # High impact malware / sandbox indicators
    "critical malware": 40,
    "executable file": 40,
    "office macro detected": 25,
    "macro": 25,
    "dangerous attachment": 25,
    "double extension": 20,
    "pdf javascript detected": 20,
    "javascript pdf": 20,
    "magic byte mismatch": 15,
    "mime type mismatch": 15,
    "high entropy": 12,
    "entropy high": 12,
    "nested archive": 12,
    "password protected archive": 12,
    "empty file": 10,
    "oversized file": 5,

    # Phishing & Email indicators
    "credential harvesting": 20,
    "display name spoofing": 20,
    "display name spoof": 20,
    "display spoof": 20,
    "lookalike domain (typosquatting)": 15,
    "lookalike domain": 15,
    "reply-to mismatch": 15,
    "spf failure": 15,
    "spf fail": 15,
    "threat language": 15,
    "threat": 15,
    "shortened url": 10,
    "urgency language": 10,
    "urgency": 10,
    "http url": 8,
    "insecure url (http)": 8,
    "multiple urls": 8,
    "multiple links": 8,
    "suspicious attachment extension": 15,
    "missing message-id header": 5,
    "missing date header": 3,
    "missing mime-version header": 3,
    "missing return-path header": 3,
}

DEFAULT_SEVERITY_WEIGHTS: Dict[str, int] = {
    "High": 15,
    "Medium": 10,
    "Low": 5,
}


# ---------------------------------------------------------------------------
# Internal Helper Functions
# ---------------------------------------------------------------------------

def _normalize_indicator_name(name: str) -> str:
    """Normalize indicator name for dictionary lookup."""
    return name.strip().lower()


def _get_weight_for_indicator(name: str, severity: str = "Medium") -> int:
    """Lookup rule weight for a given indicator name or fallback to severity base."""
    norm_name = _normalize_indicator_name(name)
    if norm_name in INDICATOR_WEIGHTS:
        return INDICATOR_WEIGHTS[norm_name]

    # Partial keyword match
    for key, weight in INDICATOR_WEIGHTS.items():
        if key in norm_name or norm_name in key:
            return weight

    # Default weight based on severity
    return DEFAULT_SEVERITY_WEIGHTS.get(severity.capitalize(), 10)


def _determine_risk_level(score: int) -> RiskLevel:
    """
    Map score (0-100) to RiskLevel enum:
    - 0–24:   LOW
    - 25–49:  MEDIUM
    - 50–74:  HIGH
    - 75–100: CRITICAL
    """
    if score >= 75:
        return RiskLevel.CRITICAL
    elif score >= 50:
        return RiskLevel.HIGH
    elif score >= 25:
        return RiskLevel.MEDIUM
    else:
        return RiskLevel.LOW


def _extract_merged_indicators(
    parsed_email: Optional[ParsedEmail],
    phishing_result: Optional[PhishingAnalyzeResponse],
    sandbox_result: Optional[SandboxAnalyzeResponse],
) -> List[Tuple[str, str, str]]:
    """
    Extract and deduplicate indicators from Phishing & Sandbox results,
    supplementing with raw parsed email signals if available.

    Returns a list of tuples: (name, severity, reason).
    """
    merged: List[Tuple[str, str, str]] = []
    seen_names: Set[str] = set()

    # 1. Add Phishing Indicators
    if phishing_result and phishing_result.indicators:
        for ind in phishing_result.indicators:
            norm_name = _normalize_indicator_name(ind.name)
            if norm_name not in seen_names:
                seen_names.add(norm_name)
                merged.append((ind.name, ind.severity, ind.reason))

    # 2. Add Sandbox Indicators
    if sandbox_result and sandbox_result.indicators:
        for ind in sandbox_result.indicators:
            norm_name = _normalize_indicator_name(ind.name)
            if norm_name not in seen_names:
                seen_names.add(norm_name)
                merged.append((ind.name, ind.severity.value if hasattr(ind.severity, 'value') else str(ind.severity), ind.reason))

    # 3. Direct checks on sandbox analysis structure if present
    if sandbox_result and sandbox_result.analysis:
        an = sandbox_result.analysis
        if an.macros and "office macro detected" not in seen_names:
            seen_names.add("office macro detected")
            merged.append(("Office Macro Detected", "High", "VBA macro code detected in attachment."))
        if an.javascript and "pdf javascript detected" not in seen_names:
            seen_names.add("pdf javascript detected")
            merged.append(("PDF JavaScript Detected", "High", "JavaScript keyword(s) detected in PDF file."))
        if an.is_executable and "executable file" not in seen_names:
            seen_names.add("executable file")
            merged.append(("Executable File", "High", "File is an executable or script payload."))
        if not an.magic_byte_valid and "magic byte mismatch" not in seen_names:
            seen_names.add("magic byte mismatch")
            merged.append(("Magic Byte Mismatch", "High", "File magic bytes do not match extension."))

    # 4. Direct checks on parsed email structure if phishing_result was omitted
    if parsed_email and not phishing_result:
        subj = (parsed_email.subject or "").lower()
        if any(w in subj for w in ["urgent", "immediately", "action required", "verify now"]):
            if "urgency language" not in seen_names:
                seen_names.add("urgency language")
                merged.append(("Urgency Language", "High", "Email subject contains high urgency keywords."))
        if parsed_email.reply_to and parsed_email.sender and parsed_email.reply_to.lower() != parsed_email.sender.lower():
            if "reply-to mismatch" not in seen_names:
                seen_names.add("reply-to mismatch")
                merged.append(("Reply-To Mismatch", "High", f"Reply-To ({parsed_email.reply_to}) differs from Sender ({parsed_email.sender})."))

    return merged


def _build_attack_path(
    merged_indicators: List[Tuple[str, str, str]],
    parsed_email: Optional[ParsedEmail],
    sandbox_result: Optional[SandboxAnalyzeResponse],
) -> List[AttackPathStage]:
    """
    Construct a logical sequence of cyber attack stages based on detected indicators.
    Stages:
    - Initial Access
    - Defense Evasion
    - Credential Theft
    - Malware Execution
    - Persistence
    """
    attack_path: List[AttackPathStage] = []
    indicator_names = {_normalize_indicator_name(name) for name, _, _ in merged_indicators}

    # 1. Initial Access
    initial_access_reasons = []
    if any(k in indicator_names for k in ["urgency language", "urgency", "threat language", "threat"]):
        initial_access_reasons.append("Phishing Email with Psychological Urgency/Threat Language")
    if any(k in indicator_names for k in ["display name spoofing", "display name spoof", "display spoof", "lookalike domain", "lookalike domain (typosquatting)"]):
        initial_access_reasons.append("Impersonated Sender Identity / Lookalike Domain")
    if any(k in indicator_names for k in ["reply-to mismatch", "spf failure", "spf fail"]):
        initial_access_reasons.append("Email Header Spoofing / Authentication Failure")

    if initial_access_reasons:
        attack_path.append(
            AttackPathStage(
                stage="Initial Access",
                reason="; ".join(initial_access_reasons),
            )
        )
    elif indicator_names or (parsed_email and parsed_email.sender):
        attack_path.append(
            AttackPathStage(
                stage="Initial Access",
                reason="Inbound Email Delivery",
            )
        )

    # 2. Defense Evasion
    evasion_reasons = []
    if any(k in indicator_names for k in ["double extension"]):
        evasion_reasons.append("Double Extension Filename Spoofing")
    if any(k in indicator_names for k in ["magic byte mismatch", "mime type mismatch"]):
        evasion_reasons.append("File Signature Spoofing (Renamed Executable/Payload)")
    if any(k in indicator_names for k in ["nested archive", "password protected archive"]):
        evasion_reasons.append("Archive Evading Security Scanners")
    if any(k in indicator_names for k in ["shortened url"]):
        evasion_reasons.append("Obfuscated URL Shortener Link")

    if evasion_reasons:
        attack_path.append(
            AttackPathStage(
                stage="Defense Evasion",
                reason="; ".join(evasion_reasons),
            )
        )

    # 3. Credential Theft
    cred_reasons = []
    if any(k in indicator_names for k in ["credential harvesting"]):
        cred_reasons.append("Fake Login Page / Credential Harvesting Link")
    if any(k in indicator_names for k in ["http url", "insecure url (http)"]):
        cred_reasons.append("Unencrypted HTTP Link for Credential Interception")

    if cred_reasons:
        attack_path.append(
            AttackPathStage(
                stage="Credential Theft",
                reason="; ".join(cred_reasons),
            )
        )

    # 4. Malware Execution
    exec_reasons = []
    if any(k in indicator_names for k in ["office macro detected", "macro"]):
        exec_reasons.append("VBA Macro Attachment Execution")
    if any(k in indicator_names for k in ["pdf javascript detected", "javascript pdf"]):
        exec_reasons.append("Embedded PDF JavaScript Auto-Execution")
    if any(k in indicator_names for k in ["executable file", "critical malware", "dangerous attachment"]):
        exec_reasons.append("Direct Execution of Malicious Attachment Payload")

    if exec_reasons:
        attack_path.append(
            AttackPathStage(
                stage="Malware Execution",
                reason="; ".join(exec_reasons),
            )
        )

    # 5. Persistence / Payload Payload
    pers_reasons = []
    if any(k in indicator_names for k in ["high entropy", "entropy high"]):
        pers_reasons.append("Encrypted/Packed Payload Unpacking in System Memory")
    if any(k in indicator_names for k in ["executable file"]) and any(k in indicator_names for k in ["double extension", "magic byte mismatch"]):
        pers_reasons.append("Persistent Script / Binary Payload Installation")

    if pers_reasons:
        attack_path.append(
            AttackPathStage(
                stage="Persistence",
                reason="; ".join(pers_reasons),
            )
        )

    return attack_path


def _generate_recommendations(
    risk_level: RiskLevel,
    merged_indicators: List[Tuple[str, str, str]],
) -> List[str]:
    """Generate prioritized, actionable security recommendations."""
    recs: List[str] = []
    indicator_names = {_normalize_indicator_name(name) for name, _, _ in merged_indicators}

    if risk_level in (RiskLevel.CRITICAL, RiskLevel.HIGH):
        recs.append("Quarantine or delete this email immediately.")
        recs.append("Report this message to your Security Operations Center (SOC) or IT Security team.")

    if any(k in indicator_names for k in ["office macro detected", "pdf javascript detected", "executable file", "dangerous attachment", "double extension", "high entropy", "magic byte mismatch"]):
        recs.append("Do not open, execute, or download any attachments associated with this email.")

    if any(k in indicator_names for k in ["credential harvesting", "shortened url", "http url", "insecure url (http)", "multiple urls"]):
        recs.append("Do not click on any embedded links or enter credentials on linked web pages.")

    if any(k in indicator_names for k in ["display name spoofing", "lookalike domain", "lookalike domain (typosquatting)", "reply-to mismatch", "spf failure", "spf fail"]):
        recs.append("Verify the sender's authentic identity via an out-of-band communication channel (e.g. phone call).")

    if not recs:
        recs.append("No high-risk threats detected. Standard security awareness practices apply.")

    return recs


def _generate_xai_summary(
    risk_score: int,
    risk_level: RiskLevel,
    merged_indicators: List[Tuple[str, str, str]],
    parsed_email: Optional[ParsedEmail],
    sandbox_result: Optional[SandboxAnalyzeResponse],
) -> str:
    """
    Generate a deterministic, plain-English Explainable AI (XAI) summary.
    No LLM inference or external AI APIs used.
    """
    if not merged_indicators and risk_score == 0:
        return (
            "This email and its attachments are classified as LOW RISK (Score: 0/100). "
            "No phishing indicators, malicious macros, spoofing signals, or suspicious file structures were detected."
        )

    key_triggers = []
    for name, _, _ in merged_indicators[:4]:
        key_triggers.append(name.lower())

    triggers_str = ", ".join(key_triggers[:-1]) + (f" and {key_triggers[-1]}" if len(key_triggers) > 1 else key_triggers[0]) if key_triggers else "suspicious characteristics"

    attachment_name = sandbox_result.filename if (sandbox_result and sandbox_result.filename) else ""
    attachment_phrase = f" containing attachment '{attachment_name}'" if attachment_name else ""

    impact_phrase = ""
    indicator_names = {_normalize_indicator_name(name) for name, _, _ in merged_indicators}
    if any(k in indicator_names for k in ["office macro detected", "executable file", "pdf javascript detected"]):
        impact_phrase = " Opening the attachment could execute unauthorized code or malware on your system."
    elif any(k in indicator_names for k in ["credential harvesting", "shortened url", "insecure url (http)"]):
        impact_phrase = " Interacting with links could result in credential theft or phishing account compromise."
    elif any(k in indicator_names for k in ["display name spoofing", "lookalike domain", "reply-to mismatch"]):
        impact_phrase = " The sender appears to be impersonating a legitimate identity to manipulate the recipient."

    return (
        f"This email{attachment_phrase} is classified as {risk_level.value} RISK (Score: {risk_score}/100) "
        f"because it exhibits key security indicators including {triggers_str}.{impact_phrase}"
    )


# ---------------------------------------------------------------------------
# Core Analysis Engine Entry Point
# ---------------------------------------------------------------------------

def calculate_risk(request: RiskAnalyzeRequest) -> RiskAnalyzeResponse:
    """
    Core entry point for Phase 5 Explainable Risk Engine.

    Calculates weighted risk score, assigns risk level, builds attack path,
    generates recommendations and XAI summary.

    Parameters
    ----------
    request: RiskAnalyzeRequest
        Contains optional parsed_email, phishing_result, and sandbox_result.

    Returns
    -------
    RiskAnalyzeResponse
        Complete risk report object ready for JSON response.
    """
    logger.info("Risk analysis engine called.")

    # 1. Extract and merge all indicators
    merged_indicators = _extract_merged_indicators(
        request.parsed_email,
        request.phishing_result,
        request.sandbox_result,
    )

    # 2. Calculate weighted score
    raw_score = 0
    reasons: List[str] = []
    for name, severity, reason in merged_indicators:
        weight = _get_weight_for_indicator(name, severity)
        raw_score += weight
        reasons.append(f"[{severity.upper()}] {name}: {reason}")

    # Also account for sandbox risk score contribution if sandbox_result provided
    if request.sandbox_result and request.sandbox_result.risk_score > 0 and not merged_indicators:
        raw_score += int(request.sandbox_result.risk_score * 0.75)
        reasons.append(f"[SANDBOX] Sandbox Engine reported a risk score of {request.sandbox_result.risk_score}/100.")

    # Clamp score to [0, 100]
    final_score = min(100, raw_score)

    # 3. Determine Risk Level
    risk_level = _determine_risk_level(final_score)

    # 4. Build Attack Path
    attack_path = _build_attack_path(
        merged_indicators,
        request.parsed_email,
        request.sandbox_result,
    )

    # 5. Generate Recommendations
    recommendations = _generate_recommendations(risk_level, merged_indicators)

    # 6. Generate Explainable AI Summary
    summary = _generate_xai_summary(
        final_score,
        risk_level,
        merged_indicators,
        request.parsed_email,
        request.sandbox_result,
    )

    logger.info(
        "Risk engine finished: final_score=%d, risk_level=%s, indicators_count=%d, attack_path_stages=%d",
        final_score,
        risk_level.value,
        len(merged_indicators),
        len(attack_path),
    )

    return RiskAnalyzeResponse(
        status="success",
        risk_score=final_score,
        risk_level=risk_level,
        reasons=reasons,
        recommendations=recommendations,
        attack_path=attack_path,
        summary=summary,
    )
