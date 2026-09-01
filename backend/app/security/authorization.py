from fastapi import Depends, HTTPException, Request, status
from app.auth.dependencies import get_current_user
from app.auth import models as auth_models
from app.security.permission_service import require_permission, has_permission
from app.security.security_utils import rate_limiter


# =====================================================
# Permission Dependencies
# =====================================================

def require_admin(
    current_user: auth_models.User = Depends(get_current_user),
) -> auth_models.User:
    if current_user.role != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required.",
        )
    return current_user


def require_doctor_or_admin(
    current_user: auth_models.User = Depends(get_current_user),
) -> auth_models.User:
    if current_user.role not in ("Admin", "Doctor"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Doctor or Admin access required.",
        )
    return current_user


# =====================================================
# Rate Limiting Dependency
# =====================================================

def rate_limit_login(request: Request) -> None:
    client_ip = request.client.host if request.client else "unknown"
    key = f"login:{client_ip}"

    if rate_limiter.is_rate_limited(key, max_requests=5, window_seconds=300):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login attempts. Try again in 5 minutes.",
        )


def rate_limit_api(request: Request) -> None:
    client_ip = request.client.host if request.client else "unknown"
    key = f"api:{client_ip}"

    if rate_limiter.is_rate_limited(key, max_requests=100, window_seconds=60):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Try again later.",
        )


# =====================================================
# Resource Permission Factory
# =====================================================

def permission_required(resource: str, action: str):
    def dependency(
        current_user: auth_models.User = Depends(get_current_user),
    ) -> auth_models.User:
        require_permission(current_user.role, resource, action)
        return current_user

    return dependency
