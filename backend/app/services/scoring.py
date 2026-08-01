"""
services/scoring.py
-------------------
Risk scoring engine for TEAM_TECH.

Calculates aggregated risk score (0-100), risk level (Safe, Low, Medium, High),
remediation recommendations, summary, and attack path steps.
"""

from typing import Any, Dict, List, Optional, Tuple


def calculate_risk_score(
    phishing_indicators: List[Dict[str, Any]],
    sandbox_indicators: List[Dict[str, Any]] = None,
) -> Tuple[int, str]:
    """
    Calculate risk score (0-100) and risk level.
    """
    sandbox_indicators = sandbox_indicators or []
    score = 0

    severity_weights = {
        "High": 35,
        "Medium": 20,
        "Low": 10,
    }

    for ind in phishing_indicators:
        sev = ind.get("severity", "Low")
        score += severity_weights.get(sev, 10)

    for ind in sandbox_indicators:
        sev = ind.get("severity", "Low")
        score += severity_weights.get(sev, 10)

    score = min(100, score)

    if score >= 75:
        level = "High"
    elif score >= 45:
        level = "Medium"
    elif score >= 15:
        level = "Low"
    else:
        level = "Safe"

    return score, level


def generate_attack_path(
    sender: Optional[str],
    subject: Optional[str],
    phishing_indicators: List[Dict[str, Any]],
    sandbox_indicators: List[Dict[str, Any]] = None,
) -> List[str]:
    """
    Generate step-by-step MITRE ATT&CK style attack path analysis.
    """
    sandbox_indicators = sandbox_indicators or []
    steps = []

    steps.append(f"1. Initial Access: Email received from '{sender or 'Unknown Sender'}' with subject '{subject or 'No Subject'}'.")

    phishing_names = [i.get("name", "") for i in phishing_indicators]
    if any("Urgency" in n or "Threat" in n for n in phishing_names):
        steps.append("2. Social Engineering: Email utilizes high urgency/threat language to compel recipient action.")
    elif any("Lookalike" in n or "Spoof" in n for n in phishing_names):
        steps.append("2. Impersonation: Sender address leverages lookalike domain or display-name spoofing.")
    else:
        steps.append("2. Ingress Analysis: Email content parsed and inspected for malicious indicators.")

    if any("URL" in n or "Link" in n or "Harvesting" in n for n in phishing_names):
        steps.append("3. Execution / Weaponization: Suspicious links or credential harvesting forms embedded in email body.")
    
    if sandbox_indicators:
        sb_reasons = [i.get("reason", "") for i in sandbox_indicators]
        steps.append(f"4. Malware / Attachment Analysis: Attachment static analysis flagged {len(sandbox_indicators)} risk factor(s).")
    else:
        steps.append("4. Impact Assessment: Security posture evaluated against active threat signatures.")

    return steps


def generate_recommendations(risk_level: str) -> str:
    """
    Generate remediation advice based on risk level.
    """
    if risk_level == "High":
        return (
            "CRITICAL: Do NOT click links or open attachments in this email. "
            "Report the email immediately to your Security Operations Center (SOC) "
            "and isolate affected user devices."
        )
    elif risk_level == "Medium":
        return (
            "WARNING: Email contains suspicious elements. Verify the sender address "
            "and confirm legitimacy via an alternative communication channel before opening links."
        )
    elif risk_level == "Low":
        return "NOTICE: Minor anomalies detected. Proceed with standard caution."
    else:
        return "SAFE: Email passed all security checks. No suspicious indicators detected."
