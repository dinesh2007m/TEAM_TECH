import os
from pathlib import Path

# Base directory of backend
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Upload settings
UPLOAD_DIR = os.getenv("UPLOAD_DIR", str(BASE_DIR / "uploads" / "emails"))
MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024  # 20 MB limit
ALLOWED_EXTENSIONS = {".eml"}
