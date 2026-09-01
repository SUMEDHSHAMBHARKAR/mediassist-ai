from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import logging

logger = logging.getLogger("exceptions")


# =====================================================
# Custom Exception Classes
# =====================================================

class AppException(Exception):
    def __init__(
        self,
        status_code: int = 500,
        detail: str = "Internal server error",
        error_code: str = "INTERNAL_ERROR",
    ):
        self.status_code = status_code
        self.detail = detail
        self.error_code = error_code


class NotFoundException(AppException):
    def __init__(self, resource: str = "Resource", resource_id: int | str | None = None):
        detail = f"{resource} not found" if resource_id is None else f"{resource} with id {resource_id} not found"
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail,
            error_code="NOT_FOUND",
        )


class UnauthorizedException(AppException):
    def __init__(self, detail: str = "Authentication required"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            error_code="UNAUTHORIZED",
        )


class ForbiddenException(AppException):
    def __init__(self, detail: str = "Permission denied"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
            error_code="FORBIDDEN",
        )


class ConflictException(AppException):
    def __init__(self, detail: str = "Resource already exists"):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail,
            error_code="CONFLICT",
        )


class ValidationException(AppException):
    def __init__(self, detail: str = "Validation error"):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=detail,
            error_code="VALIDATION_ERROR",
        )


class RateLimitException(AppException):
    def __init__(self, detail: str = "Rate limit exceeded"):
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=detail,
            error_code="RATE_LIMITED",
        )


# =====================================================
# Unified Error Response
# =====================================================

def error_response(
    status_code: int,
    detail: str,
    error_code: str = "ERROR",
    request_id: str | None = None,
) -> JSONResponse:
    content = {
        "success": False,
        "error": {
            "code": error_code,
            "message": detail,
        },
    }
    if request_id:
        content["request_id"] = request_id

    return JSONResponse(status_code=status_code, content=content)


# =====================================================
# Exception Handlers (register on app)
# =====================================================

async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    request_id = getattr(request.state, "request_id", None)
    logger.warning(f"AppException [{exc.error_code}]: {exc.detail}")
    return error_response(
        status_code=exc.status_code,
        detail=exc.detail,
        error_code=exc.error_code,
        request_id=request_id,
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    request_id = getattr(request.state, "request_id", None)
    return error_response(
        status_code=exc.status_code,
        detail=exc.detail,
        error_code="HTTP_ERROR",
        request_id=request_id,
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    request_id = getattr(request.state, "request_id", None)
    errors = exc.errors()
    detail = "; ".join(
        f"{'.'.join(str(loc) for loc in e['loc'])}: {e['msg']}"
        for e in errors
    )
    return error_response(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail=detail,
        error_code="VALIDATION_ERROR",
        request_id=request_id,
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    request_id = getattr(request.state, "request_id", None)
    logger.error(f"Unhandled exception: {type(exc).__name__}: {exc}", exc_info=True)
    return error_response(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="An unexpected error occurred",
        error_code="INTERNAL_ERROR",
        request_id=request_id,
    )
