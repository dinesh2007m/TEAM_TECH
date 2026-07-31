from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class AttachmentMetadata(BaseModel):
    """Metadata for an email attachment."""
    filename: Optional[str] = Field(None, description="Filename of the attachment")
    content_type: str = Field("application/octet-stream", description="MIME content type of the attachment")
    extension: str = Field("", description="File extension (e.g. .pdf, .docx)")
    size: int = Field(0, description="Size of attachment in bytes")
    inline: bool = Field(False, description="True if attachment is inline/embedded image")


class ParsedEmail(BaseModel):
    """Structured data extracted from an email."""
    sender: Optional[str] = Field(None, description="Sender address (From header)")
    receiver: Optional[str] = Field(None, description="Recipient address (To header)")
    cc: Optional[str] = Field(None, description="Carbon copy recipients (Cc header)")
    bcc: Optional[str] = Field(None, description="Blind carbon copy recipients (Bcc header)")
    subject: Optional[str] = Field(None, description="Email subject")
    date: Optional[str] = Field(None, description="Email sent date")
    reply_to: Optional[str] = Field(None, description="Reply-To header")
    return_path: Optional[str] = Field(None, description="Return-Path header")
    message_id: Optional[str] = Field(None, description="Message-ID header")
    mime_version: Optional[str] = Field(None, description="MIME-Version header")
    content_type: Optional[str] = Field(None, description="Main content type")
    headers: Dict[str, Any] = Field(default_factory=dict, description="All raw email headers")
    body_text: str = Field("", description="Plain text body content")
    body_html: str = Field("", description="HTML body content")
    urls: List[str] = Field(default_factory=list, description="Extracted deduplicated URLs")
    attachments: List[AttachmentMetadata] = Field(default_factory=list, description="Attachment metadata items")


class EmailUploadResponse(BaseModel):
    """API response schema for email upload."""
    status: str = Field("success", description="Status of the operation")
    email_id: str = Field(..., description="Unique UUID assigned to the stored email file")
    parsed_email: ParsedEmail = Field(..., description="Parsed email structural data")
