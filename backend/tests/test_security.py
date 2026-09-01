import pytest
from app.security.security_utils import (
    validate_password_strength,
    sanitize_string,
    sanitize_filename,
    validate_file_upload,
    RateLimiter,
)
from app.security.permission_service import has_permission, require_permission
from fastapi import HTTPException


class TestPasswordPolicy:
    def test_valid_password(self):
        valid, msg = validate_password_strength("Test@1234")
        assert valid

    def test_too_short(self):
        valid, msg = validate_password_strength("T@1a")
        assert not valid
        assert "at least" in msg

    def test_no_uppercase(self):
        valid, msg = validate_password_strength("test@1234")
        assert not valid
        assert "uppercase" in msg

    def test_no_lowercase(self):
        valid, msg = validate_password_strength("TEST@1234")
        assert not valid
        assert "lowercase" in msg

    def test_no_digit(self):
        valid, msg = validate_password_strength("Test@abcd")
        assert not valid
        assert "digit" in msg

    def test_no_special_char(self):
        valid, msg = validate_password_strength("Test1234a")
        assert not valid
        assert "special" in msg


class TestSanitization:
    def test_sanitize_html(self):
        result = sanitize_string("<script>alert('xss')</script>")
        assert "<script>" not in result
        assert "&lt;script&gt;" in result

    def test_sanitize_strips_whitespace(self):
        result = sanitize_string("  hello  ")
        assert result == "hello"

    def test_sanitize_filename_removes_special(self):
        result = sanitize_filename("../../etc/passwd")
        assert "/" not in result
        assert ".." not in result

    def test_sanitize_filename_empty(self):
        result = sanitize_filename("...")
        assert result == "unnamed_file"


class TestFileUploadValidation:
    def test_valid_pdf(self):
        valid, msg = validate_file_upload("application/pdf", 1024 * 1024)
        assert valid

    def test_invalid_content_type(self):
        valid, msg = validate_file_upload("application/x-executable", 1024)
        assert not valid
        assert "not allowed" in msg

    def test_file_too_large(self):
        valid, msg = validate_file_upload("application/pdf", 11 * 1024 * 1024)
        assert not valid
        assert "exceeds" in msg


class TestRateLimiter:
    def test_allows_within_limit(self):
        rl = RateLimiter()
        for _ in range(5):
            assert not rl.is_rate_limited("key1", max_requests=5, window_seconds=60)

    def test_blocks_over_limit(self):
        rl = RateLimiter()
        for _ in range(10):
            rl.is_rate_limited("key2", max_requests=10, window_seconds=60)
        assert rl.is_rate_limited("key2", max_requests=10, window_seconds=60)

    def test_reset(self):
        rl = RateLimiter()
        for _ in range(5):
            rl.is_rate_limited("key3", max_requests=5, window_seconds=60)
        rl.reset("key3")
        assert not rl.is_rate_limited("key3", max_requests=5, window_seconds=60)


class TestPermissions:
    def test_admin_has_all_patient_permissions(self):
        assert has_permission("Admin", "patients", "create")
        assert has_permission("Admin", "patients", "delete")

    def test_patient_cannot_delete(self):
        assert not has_permission("Patient", "patients", "delete")
        assert not has_permission("Patient", "patients", "update")

    def test_doctor_can_create_prescriptions(self):
        assert has_permission("Doctor", "prescriptions", "create")

    def test_patient_cannot_create_prescriptions(self):
        assert not has_permission("Patient", "prescriptions", "create")

    def test_require_permission_raises(self):
        with pytest.raises(HTTPException) as exc_info:
            require_permission("Patient", "patients", "delete")
        assert exc_info.value.status_code == 403

    def test_unknown_role_has_no_permissions(self):
        assert not has_permission("Unknown", "patients", "read")
