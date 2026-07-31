import os
import re
import uuid
import logging
import email
import email.policy
from email.header import decode_header
from email.policy import default
from html.parser import HTMLParser
from pathlib import Path
from typing import Tuple, List, Dict, Any, Optional

from app.config.settings import UPLOAD_DIR
from app.schemas.email import ParsedEmail, AttachmentMetadata

logger = logging.getLogger("app.services.ingestion")

# Regex pattern to identify URLs in text
URL_REGEX = re.compile(r'https?://[^\s<>"\'\]\)]+', re.IGNORECASE)


class HTMLUrlExtractor(HTMLParser):
    """HTML parser to extract href, src, and action URLs."""
    def __init__(self):
        super().__init__()
        self.urls: List[str] = []

    def handle_starttag(self, tag: str, attrs: list):
        for attr, val in attrs:
            if attr.lower() in ("href", "src", "action") and val:
                if val.lower().startswith(("http://", "https://")):
                    self.urls.append(val)


def save_email_file(file_content: bytes) -> Tuple[str, str]:
    """
    Save raw email content to disk in UPLOAD_DIR with a unique UUID filename.
    Never overwrites existing files.

    Returns:
        Tuple[str, str]: (email_id, absolute_file_path)
    """
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    
    while True:
        email_id = str(uuid.uuid4())
        filename = f"{email_id}.eml"
        file_path = os.path.join(UPLOAD_DIR, filename)
        if not os.path.exists(file_path):
            break
            
    with open(file_path, "wb") as f:
        f.write(file_content)
        
    logger.info(f"Successfully saved email file: email_id={email_id}, path={file_path}")
    return email_id, file_path


def decode_header_value(header_val: Optional[str]) -> Optional[str]:
    """Safely decode RFC 2047 encoded header strings."""
    if not header_val:
        return header_val
    try:
        decoded_parts = decode_header(header_val)
        result = []
        for part, encoding in decoded_parts:
            if isinstance(part, bytes):
                enc = encoding or "utf-8"
                try:
                    result.append(part.decode(enc, errors="replace"))
                except Exception:
                    result.append(part.decode("latin-1", errors="replace"))
            else:
                result.append(str(part))
        return "".join(result)
    except Exception as e:
        logger.warning(f"Error decoding header '{header_val}': {e}")
        return str(header_val)


def extract_urls(text_body: str, html_body: str) -> List[str]:
    """
    Extract and deduplicate URLs from plain text and HTML bodies.

    Returns:
        List[str]: Unique list of URLs preserving extraction order.
    """
    found_urls: List[str] = []

    # 1. Regex search on text body
    if text_body:
        found_urls.extend(URL_REGEX.findall(text_body))

    # 2. HTML parser + regex search on HTML body
    if html_body:
        parser = HTMLUrlExtractor()
        try:
            parser.feed(html_body)
            found_urls.extend(parser.urls)
        except Exception as e:
            logger.warning(f"HTML URL parser warning: {e}")
        found_urls.extend(URL_REGEX.findall(html_body))

    # Deduplicate while keeping order
    unique_urls = list(dict.fromkeys(found_urls))
    return unique_urls


def decode_payload(part: email.message.Message) -> str:
    """Safely decode message part payload to string with charset fallbacks."""
    payload_bytes = part.get_payload(decode=True)
    if not payload_bytes:
        return ""
        
    charset = part.get_content_charset()
    if charset:
        try:
            return payload_bytes.decode(charset, errors="replace")
        except (ValueError, LookupError):
            pass
            
    # Fallbacks
    for fallback in ("utf-8", "latin-1", "cp1252"):
        try:
            return payload_bytes.decode(fallback, errors="replace")
        except Exception:
            continue
            
    return payload_bytes.decode("utf-8", errors="replace")


def parse_email_content(raw_bytes: bytes) -> ParsedEmail:
    """
    Parse raw .eml bytes into structured ParsedEmail schema.

    Handles malformed structure, missing headers, encoding fallbacks,
    multi-part message body extraction, URL extraction, and attachment metadata.
    """
    if not raw_bytes or not raw_bytes.strip():
        raise ValueError("Email content is empty.")

    try:
        msg = email.message_from_bytes(raw_bytes, policy=email.policy.default)
    except Exception as e:
        logger.error(f"Failed to parse email structure from bytes: {e}")
        raise ValueError(f"Malformed email content: {e}")

    # Extract all raw headers
    headers_dict: Dict[str, Any] = {}
    for key, val in msg.items():
        decoded_val = decode_header_value(val)
        if key in headers_dict:
            if isinstance(headers_dict[key], list):
                headers_dict[key].append(decoded_val)
            else:
                headers_dict[key] = [headers_dict[key], decoded_val]
        else:
            headers_dict[key] = decoded_val

    # Specific Header Extraction
    sender = decode_header_value(msg.get("From"))
    receiver = decode_header_value(msg.get("To"))
    cc = decode_header_value(msg.get("Cc"))
    bcc = decode_header_value(msg.get("Bcc"))
    subject = decode_header_value(msg.get("Subject"))
    date = decode_header_value(msg.get("Date"))
    reply_to = decode_header_value(msg.get("Reply-To"))
    return_path = decode_header_value(msg.get("Return-Path"))
    message_id = decode_header_value(msg.get("Message-ID"))
    mime_version = decode_header_value(msg.get("MIME-Version"))
    content_type = msg.get_content_type()

    body_text_parts: List[str] = []
    body_html_parts: List[str] = []
    attachments: List[AttachmentMetadata] = []

    if msg.is_multipart():
        for part in msg.walk():
            # Skip container multipart items
            if part.is_multipart():
                continue

            content_disposition = str(part.get("Content-Disposition", ""))
            raw_filename = part.get_filename()
            filename = decode_header_value(raw_filename) if raw_filename else None

            # Check if this part is an attachment
            is_attachment = ("attachment" in content_disposition.lower()) or bool(filename)

            if is_attachment:
                part_content_type = part.get_content_type()
                ext = ""
                if filename:
                    ext = os.path.splitext(filename)[1].lower()
                
                payload = part.get_payload(decode=True)
                size = len(payload) if payload else 0
                is_inline = ("inline" in content_disposition.lower()) or bool(part.get("Content-ID"))

                attachments.append(
                    AttachmentMetadata(
                        filename=filename,
                        content_type=part_content_type,
                        extension=ext,
                        size=size,
                        inline=is_inline
                    )
                )
            else:
                part_type = part.get_content_type()
                if part_type == "text/plain":
                    body_text_parts.append(decode_payload(part))
                elif part_type == "text/html":
                    body_html_parts.append(decode_payload(part))
    else:
        # Non-multipart message
        part_type = msg.get_content_type()
        if part_type == "text/plain":
            body_text_parts.append(decode_payload(msg))
        elif part_type == "text/html":
            body_html_parts.append(decode_payload(msg))

    body_text = "\n".join(body_text_parts)
    body_html = "\n".join(body_html_parts)

    urls = extract_urls(body_text, body_html)

    return ParsedEmail(
        sender=sender,
        receiver=receiver,
        cc=cc,
        bcc=bcc,
        subject=subject,
        date=date,
        reply_to=reply_to,
        return_path=return_path,
        message_id=message_id,
        mime_version=mime_version,
        content_type=content_type,
        headers=headers_dict,
        body_text=body_text,
        body_html=body_html,
        urls=urls,
        attachments=attachments
    )
