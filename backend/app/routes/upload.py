import logging
from fastapi import APIRouter, File, UploadFile, HTTPException, status

from app.config.settings import MAX_FILE_SIZE_BYTES, ALLOWED_EXTENSIONS
from app.schemas.email import EmailUploadResponse
from app.services.ingestion import save_email_file, parse_email_content

logger = logging.getLogger("app.routes.upload")

router = APIRouter(prefix="/upload", tags=["Upload"])


@router.post(
    "/email",
    response_model=EmailUploadResponse,
    status_code=status.HTTP_200_OK,
    summary="Upload and parse an .eml file",
    description=(
        "Ingests a raw .eml file, validates format and size (max 20 MB), "
        "stores it on disk with a UUID, and returns parsed email structure, "
        "headers, body, extracted URLs, and attachment metadata."
    ),
    responses={
        200: {"description": "Email successfully uploaded and parsed."},
        400: {"description": "Validation failure (invalid extension, empty file, oversized file, or malformed email)."},
        500: {"description": "Internal server error."}
    }
)
async def upload_email(file: UploadFile = File(..., description="The .eml file to upload")):
    filename = file.filename or ""
    logger.info(f"Upload initiated: filename='{filename}'")

    # 1. Extension Validation
    if not any(filename.lower().endswith(ext) for ext in ALLOWED_EXTENSIONS):
        err_msg = f"Invalid file extension for file '{filename}'. Only .eml files are allowed."
        logger.warning(f"Validation error: {err_msg}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=err_msg
        )

    # 2. File Content Reading & Size / Empty Validation
    try:
        content = await file.read()
    except Exception as e:
        logger.error(f"Error reading uploaded file '{filename}': {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to read uploaded file."
        )

    if not content or len(content) == 0:
        err_msg = f"Uploaded file '{filename}' is empty."
        logger.warning(f"Validation error: {err_msg}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=err_msg
        )

    if len(content) > MAX_FILE_SIZE_BYTES:
        err_msg = f"File '{filename}' size ({len(content)} bytes) exceeds maximum limit of 20 MB."
        logger.warning(f"Validation error: {err_msg}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=err_msg
        )

    # 3. Parse Email Content
    try:
        parsed_email = parse_email_content(content)
    except ValueError as ve:
        logger.error(f"Parser error for file '{filename}': {ve}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Malformed email file: {ve}"
        )
    except Exception as e:
        logger.error(f"Unexpected parsing failure for file '{filename}': {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to parse email structure."
        )

    # 4. Store Email File
    try:
        email_id, saved_path = save_email_file(content)
    except Exception as e:
        logger.error(f"Failed to store email file '{filename}': {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save uploaded email to disk."
        )

    logger.info(f"Upload complete: filename='{filename}', email_id={email_id}, saved_path={saved_path}")

    return EmailUploadResponse(
        status="success",
        email_id=email_id,
        parsed_email=parsed_email
    )
