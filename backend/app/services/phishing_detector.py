"""
services/phishing_detector.py
------------------------------
Rule-based phishing detection engine (Phase 3).

Design principles:
- Every rule is an isolated function that receives the parsed email and
  returns a list of PhishingIndicator objects (empty list = no match).
- The public entry-point ``run_detection`` calls all rules and aggregates
  results. Adding a new rule requires only (1) writing the function and
  (2) appending it to ``_ALL_RULES``.
- No machine learning, no external API calls, no database I/O.
- All strings are lower-cased before comparison to ensure case-insensitive
  matching without repeated calls to .lower().
"""

import logging
import re
from email.utils import parseaddr
from typing import Callable, Dict, List, Optional, Any
from urllib.parse import urlparse

from app.schemas.phishing import PhishingAnalyzeRequest, PhishingIndicator, SeverityLevel

logger = logging.getLogger("app.services.phishing_detector")

# ── Type alias ────────────────────────────────────────────────────────────────

RuleFunction = Callable[[PhishingAnalyzeRequest], List[PhishingIndicator]]


# ─────────────────────────────────────────────────────────────────────────────
# Keyword / Domain Lists
# ─────────────────────────────────────────────────────────────────────────────

_URGENCY_KEYWORDS: List[str] = [
    "urgent", "immediately", "act now", "verify now", "limited time",
    "final warning", "asap", "attention required", "expires today",
    "important notice", "action required", "respond immediately",
]

_THREAT_KEYWORDS: List[str] = [
    "account suspended", "account locked", "account disabled",
    "security alert", "payment failed", "unauthorized login",
    "legal action", "penalty", "account blocked", "data breach",
    "breach detected", "fraud detected",
]

_CREDENTIAL_KEYWORDS: List[str] = [
    "login", "password", "verify account", "confirm identity",
    "bank account", "otp", " pin ", "credit card", "ssn",
    "social security", "security code", "enter your details",
    "sign in to confirm",
]

_URL_SHORTENERS: List[str] = [
    "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly",
    "buff.ly", "is.gd", "cutt.ly", "rb.gy", "short.io",
    "tiny.cc", "lnkd.in", "adf.ly", "rebrand.ly",
]

# Trusted brand names whose display name / domain mismatch should be flagged
_TRUSTED_BRANDS: List[str] = [
    "paypal", "microsoft", "google", "amazon", "apple", "github",
    "openai", "facebook", "instagram", "netflix", "linkedin",
    "twitter", "x.com", "dropbox", "adobe", "chase", "citibank",
    "wells fargo", "bank of america", "barclays", "hsbc",
]

# File extensions considered dangerous
_DANGEROUS_EXTENSIONS: List[str] = [
    ".exe", ".scr", ".bat", ".cmd", ".js", ".vbs",
    ".jar", ".ps1", ".zip", ".msi", ".pif", ".com",
    ".hta", ".dll", ".reg", ".lnk",
]

# IP address pattern (e.g. http://192.168.1.1/login)
_IP_IN_URL_RE = re.compile(
    r"^https?://(\d{1,3}\.){3}\d{1,3}(:\d+)?(/|$)", re.IGNORECASE
)

# Long random-looking domain: more than 30 chars in hostname
_LONG_DOMAIN_THRESHOLD = 30

# Strange TLDs not commonly used by legitimate service providers
_SUSPICIOUS_TLDS: List[str] = [
    ".xyz", ".top", ".club", ".online", ".site", ".info",
    ".biz", ".tk", ".ml", ".ga", ".cf", ".gq", ".pw",
    ".cc", ".ws", ".icu", ".buzz", ".uno", ".cyou",
]


# ─────────────────────────────────────────────────────────────────────────────
# Internal helpers
# ─────────────────────────────────────────────────────────────────────────────

def _indicator(name: str, severity: SeverityLevel, reason: str) -> PhishingIndicator:
    """Convenience factory for PhishingIndicator."""
    return PhishingIndicator(name=name, severity=severity, reason=reason)


def _combined_body(email_data: PhishingAnalyzeRequest) -> str:
    """Return lower-cased concatenation of text + HTML body."""
    return (email_data.body_text + " " + email_data.body_html).lower()


def _extract_email_address(header_value: Optional[str]) -> str:
    """
    Extract the bare email address from a header like
    'Display Name <user@example.com>' or 'user@example.com'.
    Returns empty string if parsing fails.
    """
    if not header_value:
        return ""
    _, addr = parseaddr(header_value)
    return addr.lower().strip()


def _extract_display_name(header_value: Optional[str]) -> str:
    """Extract the display/friendly name from a From-style header."""
    if not header_value:
        return ""
    name, _ = parseaddr(header_value)
    return name.lower().strip()


def _domain_of(email_address: str) -> str:
    """Return the domain part of an email address (lower-cased)."""
    if "@" in email_address:
        return email_address.split("@", 1)[1].lower()
    return ""


def _header_value(
    headers: Dict[str, Any], *keys: str
) -> str:
    """
    Case-insensitive lookup across multiple candidate header names.
    Returns the first matched value as a lower-cased string, or ''.
    """
    for key in keys:
        for hk, hv in headers.items():
            if hk.lower() == key.lower():
                val = hv if isinstance(hv, str) else str(hv)
                return val.lower()
    return ""


# ─────────────────────────────────────────────────────────────────────────────
# Rule 1 – Urgency Language
# ─────────────────────────────────────────────────────────────────────────────

def _rule_urgency_language(email_data: PhishingAnalyzeRequest) -> List[PhishingIndicator]:
    """Detect urgency-driving language in subject and body."""
    indicators: List[PhishingIndicator] = []
    subject_lower = (email_data.subject or "").lower()
    body_lower = _combined_body(email_data)

    matched_in_subject = [kw for kw in _URGENCY_KEYWORDS if kw in subject_lower]
    matched_in_body = [kw for kw in _URGENCY_KEYWORDS if kw in body_lower]

    if matched_in_subject:
        indicators.append(
            _indicator(
                "Urgency Language",
                "High",
                f"Email subject contains urgency keyword(s): {', '.join(repr(k) for k in matched_in_subject)}.",
            )
        )
    elif matched_in_body:
        indicators.append(
            _indicator(
                "Urgency Language",
                "Medium",
                f"Email body contains urgency keyword(s): {', '.join(repr(k) for k in matched_in_body)}.",
            )
        )

    return indicators


# ─────────────────────────────────────────────────────────────────────────────
# Rule 2 – Threat Language
# ─────────────────────────────────────────────────────────────────────────────

def _rule_threat_language(email_data: PhishingAnalyzeRequest) -> List[PhishingIndicator]:
    """Detect intimidation/threat language in subject and body."""
    indicators: List[PhishingIndicator] = []
    subject_lower = (email_data.subject or "").lower()
    body_lower = _combined_body(email_data)
    combined = subject_lower + " " + body_lower

    matched = [kw for kw in _THREAT_KEYWORDS if kw in combined]
    if matched:
        indicators.append(
            _indicator(
                "Threat Language",
                "High",
                f"Email contains threat/alarm keyword(s): {', '.join(repr(k) for k in matched)}.",
            )
        )
    return indicators


# ─────────────────────────────────────────────────────────────────────────────
# Rule 3 – Credential Harvesting Keywords
# ─────────────────────────────────────────────────────────────────────────────

def _rule_credential_harvesting(email_data: PhishingAnalyzeRequest) -> List[PhishingIndicator]:
    """Detect keywords associated with credential harvesting."""
    body_lower = _combined_body(email_data)
    matched = [kw for kw in _CREDENTIAL_KEYWORDS if kw in body_lower]
    if matched:
        return [
            _indicator(
                "Credential Harvesting",
                "High",
                f"Email body contains credential-harvesting keyword(s): {', '.join(repr(k) for k in matched)}.",
            )
        ]
    return []


# ─────────────────────────────────────────────────────────────────────────────
# Rule 4 – Suspicious URL (HTTP, IP, long domain, strange TLD)
# ─────────────────────────────────────────────────────────────────────────────

def _rule_suspicious_urls(email_data: PhishingAnalyzeRequest) -> List[PhishingIndicator]:
    """Analyse each URL for multiple suspicious characteristics."""
    indicators: List[PhishingIndicator] = []
    if not email_data.urls:
        return indicators

    http_urls: List[str] = []
    ip_urls: List[str] = []
    long_domain_urls: List[str] = []
    strange_tld_urls: List[str] = []

    for url in email_data.urls:
        url_lower = url.lower()

        # Non-HTTPS
        if url_lower.startswith("http://"):
            http_urls.append(url)

        # IP address in host
        if _IP_IN_URL_RE.match(url):
            ip_urls.append(url)

        try:
            parsed = urlparse(url)
            hostname = (parsed.hostname or "").lower()

            # Long hostname
            if len(hostname) > _LONG_DOMAIN_THRESHOLD:
                long_domain_urls.append(url)

            # Suspicious TLD
            for tld in _SUSPICIOUS_TLDS:
                if hostname.endswith(tld):
                    strange_tld_urls.append(url)
                    break
        except Exception:
            pass

    if http_urls:
        indicators.append(
            _indicator(
                "Insecure URL (HTTP)",
                "Medium",
                f"Found {len(http_urls)} unencrypted HTTP URL(s): {', '.join(http_urls[:3])}.",
            )
        )
    if ip_urls:
        indicators.append(
            _indicator(
                "IP Address URL",
                "High",
                f"URL(s) use a raw IP address instead of a domain name: {', '.join(ip_urls[:3])}.",
            )
        )
    if long_domain_urls:
        indicators.append(
            _indicator(
                "Suspiciously Long Domain",
                "Medium",
                f"URL(s) contain unusually long hostname(s) (>{_LONG_DOMAIN_THRESHOLD} chars): "
                f"{', '.join(long_domain_urls[:3])}.",
            )
        )
    if strange_tld_urls:
        indicators.append(
            _indicator(
                "Suspicious TLD",
                "Medium",
                f"URL(s) use uncommon/suspicious TLD(s): {', '.join(strange_tld_urls[:3])}.",
            )
        )

    return indicators


# ─────────────────────────────────────────────────────────────────────────────
# Rule 5 – URL Shortener
# ─────────────────────────────────────────────────────────────────────────────

def _rule_url_shorteners(email_data: PhishingAnalyzeRequest) -> List[PhishingIndicator]:
    """Flag any URL whose host matches a known shortener service."""
    indicators: List[PhishingIndicator] = []
    found: List[str] = []

    for url in email_data.urls:
        try:
            hostname = (urlparse(url).hostname or "").lower()
            for shortener in _URL_SHORTENERS:
                if hostname == shortener or hostname.endswith("." + shortener):
                    found.append(f"{url} ({shortener})")
                    break
        except Exception:
            pass

    if found:
        indicators.append(
            _indicator(
                "Shortened URL",
                "Medium",
                f"Detected {len(found)} URL shortener link(s): {', '.join(found[:5])}.",
            )
        )
    return indicators


# ─────────────────────────────────────────────────────────────────────────────
# Rule 6 – Multiple Links
# ─────────────────────────────────────────────────────────────────────────────

_MULTIPLE_URL_THRESHOLD = 3


def _rule_multiple_urls(email_data: PhishingAnalyzeRequest) -> List[PhishingIndicator]:
    """Flag emails containing an abnormally high number of URLs."""
    count = len(email_data.urls)
    if count > _MULTIPLE_URL_THRESHOLD:
        return [
            _indicator(
                "Excessive Links",
                "Medium",
                f"Email contains {count} URLs, exceeding the threshold of {_MULTIPLE_URL_THRESHOLD}. "
                "Phishing emails often include many redirect links.",
            )
        ]
    return []


# ─────────────────────────────────────────────────────────────────────────────
# Rule 7 – Display Name Spoofing
# ─────────────────────────────────────────────────────────────────────────────

def _rule_display_name_spoof(email_data: PhishingAnalyzeRequest) -> List[PhishingIndicator]:
    """
    Flag when the From display name claims to be a trusted brand but the
    actual email address does not belong to that brand's domain.
    """
    if not email_data.sender:
        return []

    display_name = _extract_display_name(email_data.sender)
    actual_email = _extract_email_address(email_data.sender)
    actual_domain = _domain_of(actual_email)

    if not display_name or not actual_domain:
        return []

    for brand in _TRUSTED_BRANDS:
        # Brand name appears in the display name
        if brand not in display_name:
            continue

        # Brand's canonical domain fragment (e.g. "paypal" → "paypal.com")
        brand_token = brand.replace(" ", "").split(".")[0]  # "bank of america" → "bankofamerica"
        if brand_token not in actual_domain:
            return [
                _indicator(
                    "Display Name Spoofing",
                    "High",
                    f"Sender display name claims to be '{brand}' but the actual address "
                    f"'{actual_email}' does not match the expected domain.",
                )
            ]
    return []


# ─────────────────────────────────────────────────────────────────────────────
# Rule 8 – Domain Mismatch / Lookalike
# ─────────────────────────────────────────────────────────────────────────────

def _rule_domain_mismatch(email_data: PhishingAnalyzeRequest) -> List[PhishingIndicator]:
    """
    Detect common domain spoofing techniques:
    - Trusted brand name in local-part/subdomain when using a free provider
      (e.g. paypal-support@gmail.com)
    - Typosquatting: brand token appears inside the domain as a deliberate near-miss
      (e.g. paypa1.com, arnazon.com) but the domain is NOT the legitimate one.

    Uses whole-word / minimum-length guards to avoid false positives from very
    short brand tokens such as 'x' matching unrelated domains like 'example.com'.
    """
    indicators: List[PhishingIndicator] = []
    actual_email = _extract_email_address(email_data.sender)
    actual_domain = _domain_of(actual_email)

    if not actual_domain:
        return indicators

    # Free/consumer email providers — legitimate companies rarely use them
    _FREE_PROVIDERS = {"gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com"}

    for brand in _TRUSTED_BRANDS:
        brand_token = brand.replace(" ", "").split(".")[0]  # e.g. 'bank of america' -> 'bankofamerica'

        # Skip very short tokens (≤3 chars) to avoid spurious substring matches
        if len(brand_token) <= 3:
            continue

        # ── Check 1: brand keyword in email address but using a free provider ──
        if brand_token in actual_email and actual_domain in _FREE_PROVIDERS:
            indicators.append(
                _indicator(
                    "Brand Domain Mismatch",
                    "High",
                    f"Sender '{actual_email}' references '{brand}' but uses a free email provider "
                    f"({actual_domain}). Legitimate organisations use their own domains.",
                )
            )
            break

        # ── Check 2: typosquatted domain ──────────────────────────────────────
        # The brand token must appear in the domain, but the domain must NOT be
        # the legitimate brand domain (brand_token.com) and must NOT be a
        # legitimate sub-domain (e.g. mail.paypal.com is fine).
        domain_stem = actual_domain.split(".")[0]  # 'paypa1' from 'paypa1.com'
        if (
            brand_token in actual_domain
            and actual_domain != f"{brand_token}.com"
            and domain_stem != brand_token  # rule out subdomains of legitimate domain
            and brand_token in domain_stem  # brand token is in the primary label
        ):
            indicators.append(
                _indicator(
                    "Lookalike Domain (Typosquatting)",
                    "High",
                    f"Domain '{actual_domain}' appears to impersonate '{brand}' "
                    "through a lookalike / typosquatted domain name.",
                )
            )
            break

    return indicators


# ─────────────────────────────────────────────────────────────────────────────
# Rule 9 – SPF Failure
# ─────────────────────────────────────────────────────────────────────────────

def _rule_spf_failure(email_data: PhishingAnalyzeRequest) -> List[PhishingIndicator]:
    """
    Check Received-SPF and Authentication-Results headers for SPF failures.

    Handles two common header formats:
    - Authentication-Results: spf=fail / spf=softfail
    - Received-SPF: fail ... / softfail ...
    """
    # Check Authentication-Results first (combined header)
    auth_results = _header_value(email_data.headers, "authentication-results")
    if "spf=fail" in auth_results:
        return [
            _indicator(
                "SPF Failure",
                "High",
                "Authentication-Results header indicates SPF fail. "
                "The sending server is not authorised to send on behalf of this domain.",
            )
        ]
    if "spf=softfail" in auth_results:
        return [
            _indicator(
                "SPF Soft Failure",
                "Medium",
                "Authentication-Results header indicates SPF soft-fail.",
            )
        ]

    # Check standalone Received-SPF header (value starts with 'fail' or 'softfail')
    received_spf = _header_value(email_data.headers, "received-spf")
    if received_spf.startswith("fail"):
        return [
            _indicator(
                "SPF Failure",
                "High",
                "Received-SPF header indicates SPF authentication failed. "
                "The sending server is not authorised to send on behalf of this domain.",
            )
        ]
    if received_spf.startswith("softfail"):
        return [
            _indicator(
                "SPF Soft Failure",
                "Medium",
                "Received-SPF header indicates SPF soft-fail. The domain's SPF record "
                "discourages but does not prohibit this sending server.",
            )
        ]

    return []


# ─────────────────────────────────────────────────────────────────────────────
# Rule 10 – DKIM Failure
# ─────────────────────────────────────────────────────────────────────────────

def _rule_dkim_failure(email_data: PhishingAnalyzeRequest) -> List[PhishingIndicator]:
    """Check Authentication-Results headers for DKIM failures."""
    auth_results = _header_value(email_data.headers, "authentication-results")
    if "dkim=fail" in auth_results or "dkim=none" in auth_results:
        severity: SeverityLevel = "High" if "dkim=fail" in auth_results else "Medium"
        label = "Failure" if severity == "High" else "Not Present"
        return [
            _indicator(
                f"DKIM {label}",
                severity,
                f"DKIM (DomainKeys Identified Mail) check result: "
                f"{'fail' if severity == 'High' else 'none'}. "
                "The email signature cannot be verified, indicating possible tampering or forgery.",
            )
        ]
    return []


# ─────────────────────────────────────────────────────────────────────────────
# Rule 11 – DMARC Failure
# ─────────────────────────────────────────────────────────────────────────────

def _rule_dmarc_failure(email_data: PhishingAnalyzeRequest) -> List[PhishingIndicator]:
    """Check Authentication-Results headers for DMARC failures."""
    auth_results = _header_value(email_data.headers, "authentication-results")
    if "dmarc=fail" in auth_results:
        return [
            _indicator(
                "DMARC Failure",
                "High",
                "DMARC (Domain-based Message Authentication) check failed. "
                "The email violates the domain owner's published policy.",
            )
        ]
    if "dmarc=none" in auth_results:
        return [
            _indicator(
                "DMARC Not Configured",
                "Low",
                "No DMARC record found for the sender's domain. "
                "The domain has not published an email authentication policy.",
            )
        ]
    return []


# ─────────────────────────────────────────────────────────────────────────────
# Rule 12 – Reply-To Mismatch
# ─────────────────────────────────────────────────────────────────────────────

def _rule_reply_to_mismatch(email_data: PhishingAnalyzeRequest) -> List[PhishingIndicator]:
    """Flag when the Reply-To domain differs from the From domain."""
    if not email_data.reply_to:
        return []

    from_domain = _domain_of(_extract_email_address(email_data.sender))
    reply_domain = _domain_of(_extract_email_address(email_data.reply_to))

    if not from_domain or not reply_domain:
        return []

    if from_domain != reply_domain:
        return [
            _indicator(
                "Reply-To Domain Mismatch",
                "High",
                f"The From domain '{from_domain}' does not match the Reply-To domain "
                f"'{reply_domain}'. Replies will be directed to a different server — "
                "a common phishing tactic to capture responses.",
            )
        ]
    return []


# ─────────────────────────────────────────────────────────────────────────────
# Rule 13 – Suspicious / Missing Headers
# ─────────────────────────────────────────────────────────────────────────────

def _rule_suspicious_headers(email_data: PhishingAnalyzeRequest) -> List[PhishingIndicator]:
    """Detect missing or forged mandatory email headers."""
    indicators: List[PhishingIndicator] = []

    if not email_data.message_id:
        indicators.append(
            _indicator(
                "Missing Message-ID Header",
                "Medium",
                "The Message-ID header is absent. Legitimate mailers always generate this "
                "unique identifier. Its absence may indicate a manually crafted phishing email.",
            )
        )

    if not email_data.date:
        indicators.append(
            _indicator(
                "Missing Date Header",
                "Low",
                "The Date header is absent. This is unusual for legitimate email servers.",
            )
        )

    if not email_data.mime_version:
        indicators.append(
            _indicator(
                "Missing MIME-Version Header",
                "Low",
                "MIME-Version header is absent. Standard email clients always include this.",
            )
        )

    # Forged / suspicious X-Mailer values
    x_mailer = _header_value(email_data.headers, "x-mailer")
    suspicious_mailers = ["massmailer", "bulkmailer", "spamtool", "sendblaster", "atom"]
    for sm in suspicious_mailers:
        if sm in x_mailer:
            indicators.append(
                _indicator(
                    "Suspicious X-Mailer",
                    "Medium",
                    f"X-Mailer header value '{x_mailer}' is associated with bulk/spam sending tools.",
                )
            )
            break

    # Unknown / missing Return-Path
    if not email_data.return_path:
        indicators.append(
            _indicator(
                "Missing Return-Path Header",
                "Low",
                "Return-Path header is absent. Legitimate email delivery always sets this field.",
            )
        )

    return indicators


# ─────────────────────────────────────────────────────────────────────────────
# Rule 14 – Dangerous Attachments
# ─────────────────────────────────────────────────────────────────────────────

def _rule_dangerous_attachments(email_data: PhishingAnalyzeRequest) -> List[PhishingIndicator]:
    """Flag attachments with known-dangerous file extensions."""
    indicators: List[PhishingIndicator] = []
    dangerous: List[str] = []

    for att in email_data.attachments:
        # Check extension field directly
        ext = (att.extension or "").lower()
        if not ext and att.filename:
            # Derive from filename if extension field is empty
            parts = att.filename.rsplit(".", 1)
            ext = f".{parts[-1].lower()}" if len(parts) > 1 else ""

        if ext in _DANGEROUS_EXTENSIONS:
            label = att.filename or f"(unnamed){ext}"
            dangerous.append(label)

    if dangerous:
        indicators.append(
            _indicator(
                "Dangerous Attachment",
                "High",
                f"Email contains {len(dangerous)} attachment(s) with dangerous extension(s): "
                f"{', '.join(dangerous[:5])}. These file types are commonly used to deliver malware.",
            )
        )
    return indicators


# ─────────────────────────────────────────────────────────────────────────────
# Rule 15 – HTML Form / Login Form Detection
# ─────────────────────────────────────────────────────────────────────────────

_HTML_FORM_RE = re.compile(r"<form[\s>]", re.IGNORECASE)
_PASSWORD_INPUT_RE = re.compile(
    r'<input[^>]+type\s*=\s*["\']?password["\']?', re.IGNORECASE
)


def _rule_html_form_detection(email_data: PhishingAnalyzeRequest) -> List[PhishingIndicator]:
    """Detect embedded HTML forms — used to steal credentials in-email."""
    indicators: List[PhishingIndicator] = []
    html = email_data.body_html

    if not html:
        return indicators

    if _HTML_FORM_RE.search(html):
        indicators.append(
            _indicator(
                "Embedded HTML Form",
                "High",
                "The email body contains an HTML <form> element. Legitimate emails never "
                "embed login or data-collection forms — this is a strong phishing indicator.",
            )
        )

    if _PASSWORD_INPUT_RE.search(html):
        indicators.append(
            _indicator(
                "Password Input in HTML Body",
                "High",
                "The email body contains a password input field. Entering credentials directly "
                "in an email is never legitimate and indicates a credential-harvesting attempt.",
            )
        )

    return indicators


# ─────────────────────────────────────────────────────────────────────────────
# Rule Registry
# ─────────────────────────────────────────────────────────────────────────────

_ALL_RULES: List[RuleFunction] = [
    _rule_urgency_language,         # 1
    _rule_threat_language,          # 2
    _rule_credential_harvesting,    # 3
    _rule_suspicious_urls,          # 4
    _rule_url_shorteners,           # 5
    _rule_multiple_urls,            # 6
    _rule_display_name_spoof,       # 7
    _rule_domain_mismatch,          # 8
    _rule_spf_failure,              # 9
    _rule_dkim_failure,             # 10
    _rule_dmarc_failure,            # 11
    _rule_reply_to_mismatch,        # 12
    _rule_suspicious_headers,       # 13
    _rule_dangerous_attachments,    # 14
    _rule_html_form_detection,      # 15
]


# ─────────────────────────────────────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────────────────────────────────────

def _overall_risk(indicators: List[PhishingIndicator]) -> SeverityLevel:
    """Derive the overall risk level from the highest-severity indicator."""
    if any(i.severity == "High" for i in indicators):
        return "High"
    if any(i.severity == "Medium" for i in indicators):
        return "Medium"
    if indicators:
        return "Low"
    return "Low"


def run_detection(email_data: PhishingAnalyzeRequest) -> List[PhishingIndicator]:
    """
    Execute all registered detection rules against the parsed email.

    Args:
        email_data: The PhishingAnalyzeRequest containing parsed email data.

    Returns:
        Flat list of all PhishingIndicator objects produced by the rule engine.
        The list is empty when no phishing signals are detected.
    """
    logger.info(
        "Detection started | sender=%s | subject=%s | urls=%d | attachments=%d",
        email_data.sender,
        email_data.subject,
        len(email_data.urls),
        len(email_data.attachments),
    )

    all_indicators: List[PhishingIndicator] = []

    for rule_fn in _ALL_RULES:
        rule_name = rule_fn.__name__
        try:
            found = rule_fn(email_data)
            if found:
                for ind in found:
                    logger.info(
                        "Indicator detected | rule=%s | name=%s | severity=%s",
                        rule_name,
                        ind.name,
                        ind.severity,
                    )
                all_indicators.extend(found)
            else:
                logger.debug("Rule passed clean | rule=%s", rule_name)
        except Exception as exc:  # noqa: BLE001
            # A single rule failure must not halt detection of other rules
            logger.error("Rule execution error | rule=%s | error=%s", rule_name, exc)

    logger.info(
        "Detection completed | total_indicators=%d | risk=%s",
        len(all_indicators),
        _overall_risk(all_indicators),
    )
    return all_indicators
