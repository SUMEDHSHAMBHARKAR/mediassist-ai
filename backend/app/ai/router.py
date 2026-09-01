from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import dependencies, models as auth_models
from app.ai import schemas
from app.ai.service import get_ai_service
from app.ai.config import get_ai_config
from app.ai.vector import COLLECTIONS

router = APIRouter(
    prefix="/ai",
    tags=["AI"],
)


# =====================================================
# AI Status
# =====================================================

@router.get("/status")
def get_ai_status(
    current_user: auth_models.User = Depends(dependencies.get_current_user),
):
    config = get_ai_config()
    return {
        "enabled": config.enabled,
        "provider": config.default_provider,
        "features": {
            "chat": config.enabled,
            "search": config.enabled,
            "ocr": False,
            "rag": config.enabled,
        },
        "collections": list(COLLECTIONS.keys()),
    }


# =====================================================
# AI Completion
# =====================================================

@router.post("/complete", response_model=schemas.AICompletionResponse)
def ai_complete(
    request: schemas.AICompletionRequest,
    db: Session = Depends(get_db),
    current_user: auth_models.User = Depends(dependencies.get_current_user),
):
    service = get_ai_service()
    return service.complete(db=db, request=request, user_id=current_user.id)


# =====================================================
# AI Search (Semantic)
# =====================================================

@router.post("/search", response_model=schemas.AISearchResponse)
def ai_search(
    request: schemas.AISearchRequest,
    current_user: auth_models.User = Depends(dependencies.get_current_user),
):
    service = get_ai_service()
    return service.search(request)


# =====================================================
# RAG Query
# =====================================================

@router.post("/rag")
def ai_rag_query(
    request: schemas.AIRAGRequest,
    current_user: auth_models.User = Depends(dependencies.get_current_user),
):
    service = get_ai_service()
    return service.get_rag_context(
        query=request.query,
        collection=request.context_type,
        top_k=request.top_k,
    )


# =====================================================
# AI Usage Stats
# =====================================================

@router.get("/usage", response_model=schemas.AIUsageStats)
def get_usage_stats(
    db: Session = Depends(get_db),
    current_user: auth_models.User = Depends(dependencies.get_current_admin),
):
    service = get_ai_service()
    return service.get_usage_stats(db=db)
