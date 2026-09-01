# =====================================================
# Pagination Defaults
# =====================================================

DEFAULT_PAGE = 1
DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100

# =====================================================
# Token Configuration
# =====================================================

ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

# =====================================================
# File Upload
# =====================================================

MAX_FILE_SIZE_MB = 10
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif"}
ALLOWED_DOCUMENT_TYPES = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}
ALLOWED_CONTENT_TYPES = ALLOWED_IMAGE_TYPES | ALLOWED_DOCUMENT_TYPES

# =====================================================
# Rate Limiting
# =====================================================

LOGIN_RATE_LIMIT = 5
LOGIN_RATE_WINDOW_SECONDS = 300
API_RATE_LIMIT = 100
API_RATE_WINDOW_SECONDS = 60

# =====================================================
# Password Policy
# =====================================================

MIN_PASSWORD_LENGTH = 8
MAX_PASSWORD_LENGTH = 128

# =====================================================
# Query Thresholds
# =====================================================

SLOW_QUERY_THRESHOLD_MS = 500
SLOW_REQUEST_THRESHOLD_MS = 1000

# =====================================================
# Batch Processing
# =====================================================

DEFAULT_BATCH_SIZE = 100
