import os
import logging
from fastapi import FastAPI, Depends, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from sqlalchemy.orm import Session

from app import schemas
from app.database import engine, Base, get_db
from app.auth import router as auth_router
from app.doctors import router as doctor_router
from app.patients import router as patient_router
from app.appointments import router as appointments_router
from app.schedules import router as schedules_router
from app.dashboard import router as dashboard_router
from app.medical_records import router as medical_record_router
from app.prescriptions import router as prescriptions_router
from app.billing import router as billing_router
from app.notifications import router as notifications_router
from app.reports import router as reports_router
from app.audit import router as audit_router
from app.ai import router as ai_router
from app.audit.middleware import audit_middleware
from app.core.performance import performance_middleware, setup_query_logging
from app.core.request_context import request_context_middleware
from app.core.health import router as health_router
from app.core.logging_config import setup_logging
from app.core.exceptions import (
    AppException,
    app_exception_handler,
    http_exception_handler,
    validation_exception_handler,
    generic_exception_handler,
)

# =====================================================
# Logging Setup
# =====================================================

ENV = os.getenv("ENV", "development")
setup_logging(
    level=os.getenv("LOG_LEVEL", "INFO"),
    structured=(ENV == "production"),
)

logger = logging.getLogger("app")

# =====================================================
# Application
# =====================================================

app = FastAPI(
    title="MediAssist AI",
    version="2.0.0",
    docs_url="/docs" if ENV != "production" else None,
    redoc_url="/redoc" if ENV != "production" else None,
)

# =====================================================
# Exception Handlers
# =====================================================

app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# =====================================================
# CORS Configuration
# =====================================================

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
    max_age=600,
)


# =====================================================
# Security Headers Middleware
# =====================================================

@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response: Response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Cache-Control"] = "no-store"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


# =====================================================
# Middleware Stack
# =====================================================

app.middleware("http")(request_context_middleware)
app.middleware("http")(audit_middleware)
setup_query_logging(engine)

# =====================================================
# Database
# =====================================================

Base.metadata.create_all(bind=engine)

# =====================================================
# Routers
# =====================================================

app.include_router(health_router)
app.include_router(auth_router.router)
app.include_router(doctor_router.router)
app.include_router(patient_router.router)
app.include_router(appointments_router.router)
app.include_router(schedules_router.router)
app.include_router(dashboard_router.router)
app.include_router(medical_record_router.router)
app.include_router(prescriptions_router.router)
app.include_router(billing_router.router)
app.include_router(notifications_router.router)
app.include_router(reports_router.router)
app.include_router(audit_router.router)
app.include_router(ai_router.router)


# =====================================================
# Root
# =====================================================

@app.get("/")
def home():
    return {"message": "Welcome to MediAssist AI"}


# =====================================================
# Lifecycle Events
# =====================================================

@app.on_event("startup")
def on_startup():
    logger.info(f"MediAssist AI starting in {ENV} mode")


@app.on_event("shutdown")
def on_shutdown():
    logger.info("MediAssist AI shutting down")
