import uuid
import time
import logging
from fastapi import Request, Response

logger = logging.getLogger("request")


# =====================================================
# Request Context Middleware
# =====================================================

async def request_context_middleware(request: Request, call_next) -> Response:
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    request.state.request_id = request_id
    request.state.start_time = time.perf_counter()

    response = await call_next(request)

    duration_ms = (time.perf_counter() - request.state.start_time) * 1000

    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time-Ms"] = f"{duration_ms:.2f}"

    logger.info(
        f"{request.method} {request.url.path} "
        f"status={response.status_code} "
        f"duration={duration_ms:.2f}ms "
        f"request_id={request_id}"
    )

    return response
