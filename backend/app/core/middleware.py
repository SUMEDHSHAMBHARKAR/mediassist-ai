from fastapi import Request, Response
from app.core.request_context import request_context_middleware


# =====================================================
# Unified Middleware Registration
# =====================================================

def register_middlewares(app):
    app.middleware("http")(request_context_middleware)
