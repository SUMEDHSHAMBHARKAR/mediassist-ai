import time
import platform
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import get_db

router = APIRouter(tags=["Health"])

APP_START_TIME = datetime.now(timezone.utc)


# =====================================================
# Health Check
# =====================================================

@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    db_status = "healthy"
    db_latency_ms = None

    try:
        start = time.perf_counter()
        db.execute(text("SELECT 1"))
        db_latency_ms = round((time.perf_counter() - start) * 1000, 2)
    except Exception:
        db_status = "unhealthy"

    uptime_seconds = (datetime.now(timezone.utc) - APP_START_TIME).total_seconds()

    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "uptime_seconds": int(uptime_seconds),
        "version": "2.0.0",
        "checks": {
            "database": {
                "status": db_status,
                "latency_ms": db_latency_ms,
            },
        },
        "system": {
            "python_version": platform.python_version(),
            "platform": platform.system(),
        },
    }


# =====================================================
# Readiness Check
# =====================================================

@router.get("/ready")
def readiness_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"ready": True}
    except Exception:
        return {"ready": False}
