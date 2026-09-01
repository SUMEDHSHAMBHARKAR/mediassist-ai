import time
import logging
from fastapi import Request, Response
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.audit import models

logger = logging.getLogger("audit")

# Paths to audit (write operations only for performance)
AUDITED_METHODS = {"POST", "PUT", "PATCH", "DELETE"}

# Paths to skip
SKIP_PATHS = {"/docs", "/redoc", "/openapi.json", "/", "/health"}


def _extract_resource_from_path(path: str) -> tuple[str, int | None]:
    parts = [p for p in path.strip("/").split("/") if p]
    resource = parts[0] if parts else "unknown"
    resource_id = None

    for i, part in enumerate(parts):
        if part.isdigit():
            resource_id = int(part)
            if i > 0:
                resource = parts[i - 1]
            break

    return resource, resource_id


def _extract_user_id_from_request(request: Request) -> int | None:
    if hasattr(request.state, "user_id"):
        return request.state.user_id
    return None


async def audit_middleware(request: Request, call_next) -> Response:
    if request.method not in AUDITED_METHODS:
        return await call_next(request)

    if request.url.path in SKIP_PATHS:
        return await call_next(request)

    start_time = time.perf_counter()
    response = await call_next(request)
    duration_ms = int((time.perf_counter() - start_time) * 1000)

    try:
        resource, resource_id = _extract_resource_from_path(request.url.path)

        action_map = {
            "POST": "create",
            "PUT": "update",
            "PATCH": "update",
            "DELETE": "delete",
        }
        action = action_map.get(request.method, request.method.lower())

        user_id = _extract_user_id_from_request(request)

        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent", "")[:255]

        db: Session = SessionLocal()
        try:
            audit_log = models.AuditLog(
                user_id=user_id,
                action=action,
                resource=resource,
                resource_id=resource_id,
                ip_address=ip_address,
                user_agent=user_agent,
                method=request.method,
                path=str(request.url.path),
                status_code=response.status_code,
                duration_ms=duration_ms,
            )
            db.add(audit_log)
            db.commit()
        except Exception as e:
            logger.error(f"Audit log failed: {e}")
            db.rollback()
        finally:
            db.close()

    except Exception as e:
        logger.error(f"Audit middleware error: {e}")

    return response
