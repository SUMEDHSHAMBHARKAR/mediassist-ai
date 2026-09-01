import re
import html
import secrets
import hashlib
from datetime import datetime, timezone


# =====================================================
# Password Policy
# =====================================================

MIN_PASSWORD_LENGTH = 8
MAX_PASSWORD_LENGTH = 128


def validate_password_strength(password: str) -> tuple[bool, str]:
    if len(password) < MIN_PASSWORD_LENGTH:
        return False, f"Password must be at least {MIN_PASSWORD_LENGTH} characters."
    if len(password) > MAX_PASSWORD_LENGTH:
        return False, f"Password must not exceed {MAX_PASSWORD_LENGTH} characters."
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter."
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter."
    if not re.search(r"\d", password):
        return False, "Password must contain at least one digit."
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False, "Password must contain at least one special character."
    return True, "Password meets requirements."


# =====================================================
# Input Sanitization
# =====================================================

def sanitize_string(value: str) -> str:
    if value is None:
        return value
    value = html.escape(value.strip())
    return value


def sanitize_filename(filename: str) -> str:
    filename = re.sub(r'[^\w\s\-.]', '', filename)
    filename = filename.strip('. ')
    if not filename:
        filename = "unnamed_file"
    return filename


# =====================================================
# Token Generation
# =====================================================

def generate_refresh_token() -> str:
    return secrets.token_urlsafe(64)


def generate_token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


# =====================================================
# File Upload Security
# =====================================================

ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}

MAX_FILE_SIZE_MB = 10
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024


def validate_file_upload(content_type: str, file_size: int) -> tuple[bool, str]:
    if content_type not in ALLOWED_CONTENT_TYPES:
        return False, f"File type '{content_type}' is not allowed."
    if file_size > MAX_FILE_SIZE_BYTES:
        return False, f"File size exceeds {MAX_FILE_SIZE_MB}MB limit."
    return True, "File is valid."


# =====================================================
# Rate Limiting (In-Memory for SQLite phase)
# =====================================================

class RateLimiter:
    def __init__(self):
        self._requests: dict[str, list[datetime]] = {}

    def is_rate_limited(
        self,
        key: str,
        max_requests: int = 60,
        window_seconds: int = 60,
    ) -> bool:
        now = datetime.now(timezone.utc)
        if key not in self._requests:
            self._requests[key] = []

        self._requests[key] = [
            t for t in self._requests[key]
            if (now - t).total_seconds() < window_seconds
        ]

        if len(self._requests[key]) >= max_requests:
            return True

        self._requests[key].append(now)
        return False

    def reset(self, key: str) -> None:
        self._requests.pop(key, None)


rate_limiter = RateLimiter()
