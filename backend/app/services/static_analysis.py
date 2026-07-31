"""
services/static_analysis.py
----------------------------
Phase 4 – Sandbox Static Analysis Engine.

Performs OFFLINE, STATIC analysis on an uploaded file.
No files are ever executed, no external services are contacted,
and no subprocesses are spawned.

Detection Rules Implemented
===========================
 1. File-type detection       (magic bytes + mimetypes fallback)
 2. MIME validation           (extension vs detected MIME)
 3. SHA-256 hashing           (hashlib)
 4. Shannon entropy           (high entropy → packed/encrypted)
 5. Embedded URL extraction   (regex over raw bytes)
 6. Office macro detection    (OLE vbaProject.bin / VBA stream)
 7. PDF JavaScript detection  (/JS /JavaScript /OpenAction /AA)
 8. Nested-archive detection  (ZIP-in-ZIP / RAR-in-ZIP / 7z-in-ZIP)
 9. Magic-byte validation     (known signatures vs extension)
10. Executable detection      (EXE, DLL, BAT, PS1, JS, JAR, APK…)
11. Double-extension detection (invoice.pdf.exe)
12. Oversized-file detection  (> 25 MB)
13. Empty-file detection
14. Password-protected archive detection
15. Risk score aggregation    (0-100 → Safe / Low / Medium / High)
"""

from __future__ import annotations

import hashlib
import io
import logging
import math
import mimetypes
import re
import zipfile
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from app.schemas.sandbox import (
    FileAnalysis,
    RiskLevel,
    SandboxAnalyzeResponse,
    SandboxIndicator,
    SeverityLevel,
)

logger = logging.getLogger("app.services.static_analysis")

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

# Maximum file size before raising the "Oversized File" indicator (25 MB)
MAX_SANDBOX_FILE_SIZE: int = 25 * 1024 * 1024  # 25 MB

# Shannon entropy threshold above which a "High Entropy" indicator is raised
HIGH_ENTROPY_THRESHOLD: float = 7.2

# Extensions that are inherently executable / script-like
EXECUTABLE_EXTENSIONS: frozenset[str] = frozenset(
    {
        ".exe", ".dll", ".bat", ".cmd", ".scr", ".msi",
        ".ps1", ".vbs", ".js", ".jar", ".apk", ".com",
        ".pif", ".wsf", ".hta",
    }
)

# Extensions associated with Office documents that can carry macros
MACRO_CAPABLE_EXTENSIONS: frozenset[str] = frozenset(
    {".doc", ".docm", ".xls", ".xlsm", ".pptm", ".dot", ".dotm"}
)

# Extensions for archive formats we inspect
ARCHIVE_EXTENSIONS: frozenset[str] = frozenset(
    {".zip", ".docx", ".xlsx", ".pptx", ".jar", ".apk", ".rar", ".7z"}
)

# Extensions for archives that contain other archives (nested)
NESTED_ARCHIVE_SIGNATURES: Dict[str, bytes] = {
    "zip": b"PK\x03\x04",
    "rar": b"Rar!",
    "7z":  b"7z\xbc\xaf\x27\x1c",
}

# Magic-byte signatures mapped to the extensions they are valid for
MAGIC_SIGNATURES: List[Tuple[bytes, str, List[str]]] = [
    (b"%PDF",                    "PDF",              [".pdf"]),
    (b"PK\x03\x04",             "ZIP/Office Open",  [".zip", ".docx", ".xlsx", ".pptx", ".jar", ".apk", ".odt", ".ods"]),
    (b"\x89PNG\r\n\x1a\n",      "PNG",              [".png"]),
    (b"\xff\xd8\xff",           "JPEG",             [".jpg", ".jpeg"]),
    (b"GIF87a",                  "GIF",              [".gif"]),
    (b"GIF89a",                  "GIF",              [".gif"]),
    (b"MZ",                      "PE Executable",    [".exe", ".dll", ".scr", ".com"]),
    (b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1", "OLE/CFB (Office 97-2003)", [".doc", ".xls", ".ppt", ".msg", ".docm", ".xlsm", ".pptm"]),
    (b"Rar!",                    "RAR Archive",      [".rar"]),
    (b"7z\xbc\xaf\x27\x1c",    "7-Zip Archive",    [".7z"]),
]

# ---------------------------------------------------------------------------
# Helper utilities
# ---------------------------------------------------------------------------

def _try_import_magic():
    """
    Attempt to import python-magic.
    Returns the magic module or None if unavailable.
    """
    try:
        import magic as _magic  # type: ignore[import]
        return _magic
    except ImportError:
        logger.warning("python-magic not available; falling back to mimetypes.")
        return None


def _compute_sha256(data: bytes) -> str:
    """Return the SHA-256 hex digest of *data*."""
    digest = hashlib.sha256(data).hexdigest()
    logger.debug("SHA-256 computed: %s", digest)
    return digest


def _compute_entropy(data: bytes) -> float:
    """
    Calculate Shannon entropy H(X) over the byte frequency distribution
    of *data*.  Returns a value in [0.0, 8.0].
    """
    if not data:
        return 0.0

    freq: Dict[int, int] = {}
    for byte in data:
        freq[byte] = freq.get(byte, 0) + 1

    length = len(data)
    entropy = -sum(
        (count / length) * math.log2(count / length)
        for count in freq.values()
        if count > 0
    )
    logger.debug("Entropy calculated: %.4f", entropy)
    return round(entropy, 4)


def _detect_mime_type(data: bytes, filename: str) -> str:
    """
    Detect MIME type from *data* bytes using python-magic when available,
    otherwise fall back to mimetypes.guess_type based on the filename.
    """
    magic_mod = _try_import_magic()
    if magic_mod is not None:
        try:
            mime = magic_mod.from_buffer(data, mime=True)
            logger.debug("MIME detected via libmagic: %s", mime)
            return mime
        except Exception as exc:
            logger.warning("libmagic detection failed: %s; using mimetypes fallback.", exc)

    guessed, _ = mimetypes.guess_type(filename)
    mime = guessed or "application/octet-stream"
    logger.debug("MIME detected via mimetypes: %s", mime)
    return mime


def _detect_file_type_label(data: bytes, mime_type: str) -> str:
    """
    Derive a short human-readable file-type label from magic bytes / MIME.
    """
    magic_mod = _try_import_magic()
    if magic_mod is not None:
        try:
            description = magic_mod.from_buffer(data)
            if description:
                # Truncate to a reasonable length
                return description[:120]
        except Exception:
            pass

    # Fallback: map MIME type to a readable label
    mime_map: Dict[str, str] = {
        "application/pdf":      "PDF",
        "application/zip":      "ZIP Archive",
        "application/x-rar":    "RAR Archive",
        "application/x-7z-compressed": "7-Zip Archive",
        "application/x-msdownload": "PE Executable (EXE/DLL)",
        "application/vnd.ms-excel": "Microsoft Excel (XLS)",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "Microsoft Excel (XLSX)",
        "application/msword":   "Microsoft Word (DOC)",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Microsoft Word (DOCX)",
        "application/vnd.ms-powerpoint": "Microsoft PowerPoint (PPT)",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation": "Microsoft PowerPoint (PPTX)",
        "image/png":            "PNG Image",
        "image/jpeg":           "JPEG Image",
        "image/gif":            "GIF Image",
        "text/plain":           "Plain Text",
        "application/javascript": "JavaScript",
        "application/x-bat":    "Batch Script",
        "application/x-sh":     "Shell Script",
        "application/java-archive": "Java Archive (JAR)",
        "application/vnd.android.package-archive": "Android Package (APK)",
    }
    return mime_map.get(mime_type, mime_type)


# ---------------------------------------------------------------------------
# Rule 1 – Magic-byte extraction
# ---------------------------------------------------------------------------

def _extract_magic_bytes(data: bytes) -> str:
    """Return the first 8 bytes of *data* as an uppercase hex string."""
    return data[:8].hex().upper() if data else ""


# ---------------------------------------------------------------------------
# Rule 9 – Magic-byte validation
# ---------------------------------------------------------------------------

def _validate_magic_bytes(data: bytes, extension: str) -> bool:
    """
    Check whether the leading bytes of *data* are consistent with *extension*.

    Returns True when the magic bytes match or when no known signature exists
    for the extension (i.e. we give the benefit of the doubt).
    """
    ext_lower = extension.lower()

    for signature, _label, valid_extensions in MAGIC_SIGNATURES:
        if ext_lower in valid_extensions:
            # We found a rule for this extension; check if bytes match
            if data[: len(signature)] == signature:
                return True
            # Extension has a known rule but bytes don't match → mismatch
            return False

    # No rule for this extension → assume valid
    return True


# ---------------------------------------------------------------------------
# Rule 5 – Embedded URL extraction
# ---------------------------------------------------------------------------

_URL_PATTERN = re.compile(
    rb"(https?://[^\s\"'<>\x00-\x1f\x7f]{3,512}|ftp://[^\s\"'<>\x00-\x1f\x7f]{3,256})",
    re.IGNORECASE,
)


def _extract_urls(data: bytes) -> List[str]:
    """
    Extract all HTTP/HTTPS/FTP URLs embedded in raw file bytes.

    Decodes each match as UTF-8 with error replacement.
    """
    raw_matches = _URL_PATTERN.findall(data)
    urls: List[str] = []
    seen: set[str] = set()
    for raw in raw_matches:
        try:
            url = raw.decode("utf-8", errors="replace").rstrip(".,;:\"')")
        except Exception:
            continue
        if url not in seen:
            seen.add(url)
            urls.append(url)
    logger.debug("Embedded URLs found: %d", len(urls))
    return urls


# ---------------------------------------------------------------------------
# Rule 7 – PDF JavaScript detection
# ---------------------------------------------------------------------------

_PDF_JS_PATTERNS: List[bytes] = [
    b"/JavaScript",
    b"/JS",
    b"/OpenAction",
    b"/AA",
]


def _detect_pdf_javascript(data: bytes) -> bool:
    """Return True if any JavaScript-related PDF keywords are present."""
    for pattern in _PDF_JS_PATTERNS:
        if pattern in data:
            logger.debug("PDF JS pattern found: %s", pattern)
            return True
    return False


# ---------------------------------------------------------------------------
# Rule 6 – Office macro detection
# ---------------------------------------------------------------------------

_VBA_SIGNATURES: List[bytes] = [
    b"vbaProject.bin",
    b"VBA",
    b"_VBA_PROJECT",
    b"ThisDocument",
    b"Module",
    b"Attribute VB_",
]


def _detect_macros(data: bytes, extension: str) -> bool:
    """
    Detect VBA macros in Office documents.

    Strategy:
    - For OOXML formats (.docm, .xlsm, .pptm) we look for 'vbaProject.bin'
      inside the ZIP central-directory listing.
    - For legacy OLE formats (.doc, .xls, .ppt) we scan raw bytes for VBA
      markers since olefile may not be available.
    """
    ext = extension.lower()

    if ext not in MACRO_CAPABLE_EXTENSIONS:
        return False

    # --- OOXML (.docm / .xlsm / .pptm) ---
    if ext in {".docm", ".xlsm", ".pptm"}:
        try:
            with zipfile.ZipFile(io.BytesIO(data)) as zf:
                names = [n.lower() for n in zf.namelist()]
                if any("vbaproject.bin" in n for n in names):
                    logger.debug("vbaProject.bin found in OOXML archive → macros detected")
                    return True
        except Exception:
            pass  # Not a valid ZIP; fall through to byte-scan

    # --- OLE legacy (.doc / .xls / .ppt) ---
    try:
        import olefile  # type: ignore[import]
        if olefile.isOleFile(io.BytesIO(data)):
            ole = olefile.OleFileIO(io.BytesIO(data))
            streams = [s for s in ole.listdir() if isinstance(s, list)]
            for path_parts in streams:
                joined = "/".join(path_parts).lower()
                if "vba" in joined or "macros" in joined:
                    logger.debug("OLE VBA stream found: %s", joined)
                    ole.close()
                    return True
            ole.close()
    except ImportError:
        logger.debug("olefile not available; using byte-scan fallback for macro detection.")
    except Exception as exc:
        logger.warning("OLE macro detection failed: %s", exc)

    # --- Byte-scan fallback ---
    for sig in _VBA_SIGNATURES:
        if sig in data:
            logger.debug("VBA byte signature found: %s", sig)
            return True

    return False


# ---------------------------------------------------------------------------
# Rule 8 – Nested-archive detection
# ---------------------------------------------------------------------------


def _detect_nested_archive(data: bytes, extension: str) -> bool:
    """
    Return True if the file is an archive that contains another archive.
    Only inspects the first level (no recursive extraction).
    """
    ext = extension.lower()

    # Only inspect ZIP-based containers
    if not (data[:4] == b"PK\x03\x04" or ext in {".zip", ".jar", ".apk", ".docx", ".xlsx", ".pptx"}):
        return False

    try:
        with zipfile.ZipFile(io.BytesIO(data)) as zf:
            for name in zf.namelist():
                lower_name = name.lower()
                if lower_name.endswith((".zip", ".rar", ".7z", ".tar", ".gz", ".bz2")):
                    logger.debug("Nested archive member found: %s", name)
                    return True
    except Exception as exc:
        logger.debug("Nested-archive scan failed (non-ZIP?): %s", exc)

    return False


# ---------------------------------------------------------------------------
# Rule 14 – Password-protected archive detection
# ---------------------------------------------------------------------------


def _detect_password_protected(data: bytes) -> bool:
    """
    Detect password-protected ZIP archives by inspecting the general-purpose
    bit flag (bit 0) in the local file headers.

    Returns True when at least one entry is encrypted.
    """
    if data[:4] != b"PK\x03\x04":
        return False

    try:
        with zipfile.ZipFile(io.BytesIO(data)) as zf:
            for info in zf.infolist():
                # flag_bits bit 0 set → entry is encrypted
                if info.flag_bits & 0x1:
                    logger.debug("Encrypted ZIP entry detected: %s", info.filename)
                    return True
    except zipfile.BadZipFile:
        # Some password-protected ZIPs can't be opened by zipfile at all
        if b"PK\x03\x04" in data and b"encrypted" in data.lower():
            return True
    except Exception as exc:
        logger.debug("Password-protection check failed: %s", exc)

    return False


# ---------------------------------------------------------------------------
# Rule 10 – Executable detection
# ---------------------------------------------------------------------------


def _detect_executable(data: bytes, extension: str) -> bool:
    """
    Return True when the file is or resembles an executable/script.
    Checks both the extension and the MZ header (PE executable).
    """
    if extension.lower() in EXECUTABLE_EXTENSIONS:
        return True
    # MZ header → Windows PE
    if data[:2] == b"MZ":
        return True
    return False


# ---------------------------------------------------------------------------
# Rule 11 – Double-extension detection
# ---------------------------------------------------------------------------

_DANGEROUS_EXTENSIONS: frozenset[str] = frozenset(
    {
        ".exe", ".dll", ".bat", ".cmd", ".scr", ".msi",
        ".ps1", ".vbs", ".js", ".jar", ".hta", ".wsf",
        ".pif", ".com",
    }
)


def _detect_double_extension(filename: str) -> bool:
    """
    Detect filenames with a double extension where the *true* extension is
    dangerous (e.g. 'invoice.pdf.exe', 'image.png.js').

    Returns True when the stem still has an extension AND the outer extension
    is in the dangerous set.
    """
    stem = Path(filename).stem
    outer_ext = Path(filename).suffix.lower()

    if outer_ext not in _DANGEROUS_EXTENSIONS:
        return False

    inner_ext = Path(stem).suffix.lower()
    if inner_ext:  # e.g. '.pdf' left over from 'invoice.pdf'
        logger.debug(
            "Double extension detected: inner=%s outer=%s", inner_ext, outer_ext
        )
        return True
    return False


# ---------------------------------------------------------------------------
# Risk scoring (Rule 15)
# ---------------------------------------------------------------------------

# Each indicator name maps to a point contribution
_INDICATOR_WEIGHTS: Dict[str, int] = {
    "Executable File":            30,
    "Double Extension":           25,
    "Magic Byte Mismatch":        20,
    "High Entropy":               20,
    "PDF JavaScript Detected":    15,
    "Office Macro Detected":      20,
    "Nested Archive":             10,
    "Password Protected Archive": 10,
    "Oversized File":              5,
    "Empty File":                 15,
    "MIME Type Mismatch":         15,
}

_SEVERITY_BONUS: Dict[str, int] = {
    SeverityLevel.HIGH:   10,
    SeverityLevel.MEDIUM:  5,
    SeverityLevel.LOW:     0,
}


def _compute_risk_score(indicators: List[SandboxIndicator]) -> int:
    """
    Aggregate a risk score (0-100) from the list of triggered indicators.

    Scoring:
    - Base: sum of per-indicator weights from _INDICATOR_WEIGHTS
    - Bonus: severity bonus for each indicator
    - Capped at 100
    """
    score = 0
    for ind in indicators:
        weight = _INDICATOR_WEIGHTS.get(ind.name, 8)
        bonus = _SEVERITY_BONUS.get(ind.severity, 0)
        score += weight + bonus
    return min(score, 100)


def _score_to_risk_level(score: int) -> RiskLevel:
    """Map a numeric risk score to a :class:`RiskLevel` band."""
    if score <= 20:
        return RiskLevel.SAFE
    if score <= 50:
        return RiskLevel.LOW
    if score <= 75:
        return RiskLevel.MEDIUM
    return RiskLevel.HIGH


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------


def run_static_analysis(filename: str, data: bytes) -> SandboxAnalyzeResponse:
    """
    Run all static-analysis rules against *data* and return a
    :class:`SandboxAnalyzeResponse`.

    This function is the single entry point called by the FastAPI route.
    It never executes the file or contacts any external service.

    Parameters
    ----------
    filename:
        The original filename supplied by the client (used for extension and
        double-extension checks).
    data:
        Raw bytes of the uploaded file.

    Returns
    -------
    SandboxAnalyzeResponse
        A fully-populated response object ready for JSON serialisation.
    """
    logger.info("Static analysis started: filename='%s', size=%d bytes", filename, len(data))

    indicators: List[SandboxIndicator] = []
    path = Path(filename)
    extension = path.suffix  # e.g. ".pdf"

    # -----------------------------------------------------------------------
    # Rule 13 – Empty file
    # -----------------------------------------------------------------------
    if not data:
        logger.info("Empty file detected: '%s'", filename)
        indicators.append(
            SandboxIndicator(
                name="Empty File",
                severity=SeverityLevel.HIGH,
                reason="The uploaded file is empty (0 bytes). Cannot perform analysis.",
            )
        )
        return SandboxAnalyzeResponse(
            filename=filename,
            risk_score=_compute_risk_score(indicators),
            risk_level=_score_to_risk_level(_compute_risk_score(indicators)),
            analysis=FileAnalysis(
                file_type="Unknown",
                extension=extension,
                mime_type="application/octet-stream",
                sha256="",
                file_size_bytes=0,
                entropy=0.0,
                magic_bytes="",
                magic_byte_valid=False,
            ),
            indicators=indicators,
        )

    # -----------------------------------------------------------------------
    # Rule 12 – Oversized file
    # -----------------------------------------------------------------------
    if len(data) > MAX_SANDBOX_FILE_SIZE:
        logger.info(
            "Oversized file detected: '%s' (%d bytes > %d bytes limit)",
            filename,
            len(data),
            MAX_SANDBOX_FILE_SIZE,
        )
        indicators.append(
            SandboxIndicator(
                name="Oversized File",
                severity=SeverityLevel.MEDIUM,
                reason=(
                    f"File size {len(data):,} bytes exceeds the 25 MB analysis threshold. "
                    "Large files can be used to exhaust resources or conceal malicious payloads."
                ),
            )
        )

    # -----------------------------------------------------------------------
    # Rule 3 – SHA-256
    # -----------------------------------------------------------------------
    sha256 = _compute_sha256(data)
    logger.info("Hash generated: sha256=%s", sha256)

    # -----------------------------------------------------------------------
    # Rule 4 – Entropy
    # -----------------------------------------------------------------------
    entropy = _compute_entropy(data)
    logger.info("Entropy calculated: %.4f", entropy)

    if entropy > HIGH_ENTROPY_THRESHOLD:
        indicators.append(
            SandboxIndicator(
                name="High Entropy",
                severity=SeverityLevel.HIGH,
                reason=(
                    f"File entropy is {entropy:.2f} (threshold: {HIGH_ENTROPY_THRESHOLD}). "
                    "Possibly packed, compressed, or encrypted content."
                ),
            )
        )

    # -----------------------------------------------------------------------
    # Rule 1 – File type detection (magic bytes → MIME → label)
    # -----------------------------------------------------------------------
    mime_type = _detect_mime_type(data, filename)
    file_type = _detect_file_type_label(data, mime_type)
    magic_bytes_hex = _extract_magic_bytes(data)
    logger.info("File type detected: '%s', MIME: '%s'", file_type, mime_type)

    # -----------------------------------------------------------------------
    # Rule 9 – Magic-byte validation
    # -----------------------------------------------------------------------
    magic_valid = _validate_magic_bytes(data, extension)
    logger.info("Magic bytes validated: valid=%s", magic_valid)

    if not magic_valid:
        indicators.append(
            SandboxIndicator(
                name="Magic Byte Mismatch",
                severity=SeverityLevel.HIGH,
                reason=(
                    f"File extension is '{extension}' but the magic bytes "
                    f"({magic_bytes_hex[:8]}) do not match the expected signature. "
                    "Possible file-type spoofing or renamed executable."
                ),
            )
        )

    # -----------------------------------------------------------------------
    # Rule 2 – MIME validation
    # -----------------------------------------------------------------------
    extension_mime, _ = mimetypes.guess_type("file" + extension)
    if extension_mime and mime_type and extension_mime != mime_type:
        # Only raise this if magic-byte check didn't already catch it (avoid dup)
        if magic_valid:
            indicators.append(
                SandboxIndicator(
                    name="MIME Type Mismatch",
                    severity=SeverityLevel.MEDIUM,
                    reason=(
                        f"Extension '{extension}' maps to MIME '{extension_mime}' "
                        f"but content detection reports '{mime_type}'. "
                        "Possible file masquerading."
                    ),
                )
            )

    # -----------------------------------------------------------------------
    # Rule 5 – Embedded URL extraction
    # -----------------------------------------------------------------------
    embedded_urls = _extract_urls(data)
    logger.info("URLs extracted: %d found", len(embedded_urls))

    # -----------------------------------------------------------------------
    # Rule 6 – Office macro detection
    # -----------------------------------------------------------------------
    macros_found = _detect_macros(data, extension)
    logger.info("Macros checked: macros_found=%s", macros_found)

    if macros_found:
        indicators.append(
            SandboxIndicator(
                name="Office Macro Detected",
                severity=SeverityLevel.HIGH,
                reason=(
                    f"VBA macro code or a 'vbaProject.bin' stream was found in '{filename}'. "
                    "Macros can be used to execute malicious code when the file is opened."
                ),
            )
        )

    # -----------------------------------------------------------------------
    # Rule 7 – PDF JavaScript detection
    # -----------------------------------------------------------------------
    js_detected = False
    if extension.lower() == ".pdf" or mime_type == "application/pdf":
        js_detected = _detect_pdf_javascript(data)
        logger.info("PDF JS checked: javascript=%s", js_detected)
        if js_detected:
            indicators.append(
                SandboxIndicator(
                    name="PDF JavaScript Detected",
                    severity=SeverityLevel.HIGH,
                    reason=(
                        "JavaScript-related keyword(s) (/JS, /JavaScript, /OpenAction, /AA) "
                        "were detected inside the PDF. Embedded JavaScript can execute "
                        "malicious code when the PDF is opened."
                    ),
                )
            )

    # -----------------------------------------------------------------------
    # Rule 8 – Nested-archive detection
    # -----------------------------------------------------------------------
    nested_archive = _detect_nested_archive(data, extension)
    logger.info("Archive checked: nested_archive=%s", nested_archive)

    if nested_archive:
        indicators.append(
            SandboxIndicator(
                name="Nested Archive",
                severity=SeverityLevel.MEDIUM,
                reason=(
                    f"'{filename}' contains a nested archive (ZIP/RAR/7z inside ZIP). "
                    "Nested archives are commonly used to evade antivirus scanning."
                ),
            )
        )

    # -----------------------------------------------------------------------
    # Rule 14 – Password-protected archive
    # -----------------------------------------------------------------------
    password_protected = _detect_password_protected(data)
    if password_protected:
        logger.info("Password-protected archive detected: '%s'", filename)
        indicators.append(
            SandboxIndicator(
                name="Password Protected Archive",
                severity=SeverityLevel.MEDIUM,
                reason=(
                    f"'{filename}' is a password-protected ZIP archive. "
                    "This is a common technique to hide malicious content from scanners."
                ),
            )
        )

    # -----------------------------------------------------------------------
    # Rule 10 – Executable detection
    # -----------------------------------------------------------------------
    is_executable = _detect_executable(data, extension)
    if is_executable:
        logger.info("Executable detected: '%s'", filename)
        indicators.append(
            SandboxIndicator(
                name="Executable File",
                severity=SeverityLevel.HIGH,
                reason=(
                    f"'{filename}' is an executable or script file (extension: '{extension}'). "
                    "Executable files received as attachments pose a high risk of malware delivery."
                ),
            )
        )

    # -----------------------------------------------------------------------
    # Rule 11 – Double-extension detection
    # -----------------------------------------------------------------------
    double_ext = _detect_double_extension(filename)
    if double_ext:
        logger.info("Double extension detected: '%s'", filename)
        indicators.append(
            SandboxIndicator(
                name="Double Extension",
                severity=SeverityLevel.HIGH,
                reason=(
                    f"'{filename}' contains a double file extension. "
                    "This is a common social-engineering trick to hide the true "
                    "executable nature of a file from the victim."
                ),
            )
        )

    # -----------------------------------------------------------------------
    # Rule 15 – Risk score aggregation
    # -----------------------------------------------------------------------
    risk_score = _compute_risk_score(indicators)
    risk_level = _score_to_risk_level(risk_score)
    logger.info(
        "Analysis completed: filename='%s', risk_score=%d, risk_level=%s, indicators=%d",
        filename,
        risk_score,
        risk_level,
        len(indicators),
    )

    analysis = FileAnalysis(
        file_type=file_type,
        extension=extension,
        mime_type=mime_type,
        sha256=sha256,
        file_size_bytes=len(data),
        entropy=entropy,
        magic_bytes=magic_bytes_hex,
        magic_byte_valid=magic_valid,
        embedded_urls=embedded_urls,
        macros=macros_found,
        javascript=js_detected,
        nested_archive=nested_archive,
        password_protected=password_protected,
        is_executable=is_executable,
        double_extension=double_ext,
    )

    return SandboxAnalyzeResponse(
        filename=filename,
        risk_score=risk_score,
        risk_level=risk_level,
        analysis=analysis,
        indicators=indicators,
    )
