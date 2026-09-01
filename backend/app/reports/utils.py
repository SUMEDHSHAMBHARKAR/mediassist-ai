from pathlib import Path
from uuid import uuid4
import shutil

from fastapi import (
    UploadFile,
    HTTPException,
    status,
)


# ======================================================
# Upload Directory
# ======================================================

UPLOAD_DIR = Path("uploads") / "reports"

UPLOAD_DIR.mkdir(
    parents=True,
    exist_ok=True,
)


# ======================================================
# Validation Constants
# ======================================================

ALLOWED_EXTENSIONS = {
    ".pdf",
    ".jpg",
    ".jpeg",
    ".png",
}

ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
}

MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB


# ======================================================
# Report Prefix
# ======================================================

REPORT_PREFIX = {
    "Blood Report": "bdr",
    "MRI": "mri",
    "CT Scan": "cts",
    "X-Ray": "xry",
    "ECG": "ecg",
    "Prescription": "pre",
    "Other": "oth",
}


# ======================================================
# Validate File
# ======================================================

def validate_file(file: UploadFile,) -> int:

    extension = Path(file.filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file extension.",
        )

    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported content type.",
        )

    file.file.seek(0, 2)

    file_size = file.file.tell()

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File size exceeds the maximum limit.",
        )

    file.file.seek(0)

    return file_size


# ======================================================
# Generate Stored Filename
# ======================================================

def generate_stored_filename(patient_id: int,report_type: str,original_filename: str,) -> str:

    extension = Path(original_filename).suffix.lower()

    prefix = REPORT_PREFIX.get(
        report_type,
        "oth",
    )

    unique_id = uuid4().hex

    return (
        f"patient_{patient_id}_"
        f"{prefix}_"
        f"{unique_id}"
        f"{extension}"
    )


# ======================================================
# Save File
# ======================================================

def save_file(file: UploadFile,stored_filename: str,) -> str:

    destination = UPLOAD_DIR / stored_filename

    file.file.seek(0)

    with open(destination, "wb") as buffer:
        shutil.copyfileobj(
            file.file,
            buffer,
        )

    return str(destination)


# ======================================================
# Delete File
# ======================================================

def delete_file(file_path: str,):
    path = Path(file_path)

    if path.exists():
        path.unlink()