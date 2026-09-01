import time
import logging
import functools
from typing import Callable

logger = logging.getLogger("performance")


# =====================================================
# Query Timer Context Manager
# =====================================================

class QueryTimer:
    def __init__(self, operation: str = "query"):
        self.operation = operation
        self.start_time = None
        self.end_time = None
        self.duration_ms = None

    def __enter__(self):
        self.start_time = time.perf_counter()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.end_time = time.perf_counter()
        self.duration_ms = (self.end_time - self.start_time) * 1000

        if self.duration_ms > 500:
            logger.warning(
                f"SLOW QUERY [{self.operation}]: {self.duration_ms:.2f}ms"
            )
        elif self.duration_ms > 100:
            logger.info(
                f"QUERY [{self.operation}]: {self.duration_ms:.2f}ms"
            )

        return False


# =====================================================
# Performance Decorator
# =====================================================

def track_performance(operation: str | None = None):
    def decorator(func: Callable):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            op_name = operation or func.__name__
            start = time.perf_counter()

            try:
                result = func(*args, **kwargs)
                return result
            finally:
                duration_ms = (time.perf_counter() - start) * 1000

                if duration_ms > 500:
                    logger.warning(
                        f"SLOW [{op_name}]: {duration_ms:.2f}ms"
                    )
                elif duration_ms > 100:
                    logger.info(
                        f"PERF [{op_name}]: {duration_ms:.2f}ms"
                    )

        return wrapper
    return decorator


# =====================================================
# Slow Query Logger (SQLAlchemy Event Listener)
# =====================================================

SLOW_QUERY_THRESHOLD_MS = 500


def setup_query_logging(engine):
    from sqlalchemy import event

    @event.listens_for(engine, "before_cursor_execute")
    def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
        conn.info.setdefault("query_start_time", []).append(time.perf_counter())

    @event.listens_for(engine, "after_cursor_execute")
    def after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
        total_ms = (time.perf_counter() - conn.info["query_start_time"].pop()) * 1000

        if total_ms > SLOW_QUERY_THRESHOLD_MS:
            logger.warning(
                f"SLOW SQL ({total_ms:.2f}ms): {statement[:200]}"
            )


# =====================================================
# Request Performance Middleware
# =====================================================

async def performance_middleware(request, call_next):
    start = time.perf_counter()

    response = await call_next(request)

    duration_ms = (time.perf_counter() - start) * 1000
    response.headers["X-Process-Time-Ms"] = f"{duration_ms:.2f}"

    if duration_ms > 1000:
        logger.warning(
            f"SLOW REQUEST: {request.method} {request.url.path} - {duration_ms:.2f}ms"
        )

    return response
