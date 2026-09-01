import time
import logging
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.ai.config import get_ai_config, get_provider_config
from app.ai.provider import get_provider
from app.ai.schemas import (
    AICompletionRequest,
    AICompletionResponse,
    AISearchRequest,
    AISearchResponse,
    AIUsageStats,
    AITaskType,
)
from app.ai.models import AIRequestLog
from app.ai.rag import get_rag_pipeline
from app.ai.vector import get_vector_store

logger = logging.getLogger("ai.service")


# =====================================================
# AI Service
# =====================================================

class AIService:
    def __init__(self):
        self.config = get_ai_config()

    def _check_enabled(self) -> None:
        if not self.config.enabled:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI features are not enabled. Set AI_ENABLED=true.",
            )

    def complete(
        self,
        db: Session,
        request: AICompletionRequest,
        user_id: int | None = None,
    ) -> AICompletionResponse:
        self._check_enabled()

        provider_config = get_provider_config(self.config.default_provider)
        provider = get_provider(provider_config)

        if not provider.is_available():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"AI provider '{provider_config.name}' is not configured.",
            )

        start_time = time.perf_counter()

        try:
            response = provider.complete(request)
            duration_ms = int((time.perf_counter() - start_time) * 1000)
            response.duration_ms = duration_ms

            self._log_request(
                db=db,
                user_id=user_id,
                task_type=request.task_type.value,
                provider=provider_config.name,
                model=provider_config.model,
                total_tokens=response.tokens_used,
                cost=response.cost_estimate,
                duration_ms=duration_ms,
                status="completed",
            )

            return response

        except HTTPException:
            # Provider configuration and upstream errors already have an
            # intentional status/message. Do not turn them into generic 500s.
            raise
        except NotImplementedError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=str(e),
            )
        except Exception as e:
            duration_ms = int((time.perf_counter() - start_time) * 1000)
            self._log_request(
                db=db,
                user_id=user_id,
                task_type=request.task_type.value,
                provider=provider_config.name,
                model=provider_config.model,
                duration_ms=duration_ms,
                status="failed",
                error_message=str(e),
            )
            raise

    def search(self, request: AISearchRequest) -> AISearchResponse:
        self._check_enabled()

        vector_store = get_vector_store(request.collection)
        results = vector_store.search(
            query=request.query,
            top_k=request.top_k,
            filters=request.filters,
        )

        return AISearchResponse(
            results=results,
            query=request.query,
            total_results=len(results),
        )

    def get_rag_context(
        self,
        query: str,
        collection: str = "medical_records",
        top_k: int = 5,
        filters: dict | None = None,
    ) -> dict:
        self._check_enabled()
        pipeline = get_rag_pipeline(collection)
        return pipeline.run(query=query, top_k=top_k, filters=filters)

    def get_usage_stats(self, db: Session, user_id: int | None = None) -> AIUsageStats:
        from sqlalchemy import func
        from datetime import date

        query = db.query(AIRequestLog)
        if user_id:
            query = query.filter(AIRequestLog.user_id == user_id)

        total_requests = query.count()
        total_tokens = db.query(func.sum(AIRequestLog.total_tokens)).scalar() or 0
        total_cost = db.query(func.sum(AIRequestLog.cost)).scalar() or 0.0
        avg_latency = db.query(func.avg(AIRequestLog.duration_ms)).scalar() or 0.0

        today = date.today()
        requests_today = (
            query.filter(func.date(AIRequestLog.created_at) == today).count()
        )

        return AIUsageStats(
            total_requests=total_requests,
            total_tokens=total_tokens,
            total_cost=round(total_cost, 4),
            requests_today=requests_today,
            average_latency_ms=round(avg_latency, 2),
        )

    def _log_request(
        self,
        db: Session,
        user_id: int | None,
        task_type: str,
        provider: str,
        model: str,
        total_tokens: int | None = None,
        cost: float | None = None,
        duration_ms: int | None = None,
        status: str = "completed",
        error_message: str | None = None,
    ) -> None:
        try:
            log = AIRequestLog(
                user_id=user_id,
                task_type=task_type,
                provider=provider,
                model=model,
                total_tokens=total_tokens,
                cost=cost,
                duration_ms=duration_ms,
                status=status,
                error_message=error_message,
            )
            db.add(log)
            db.commit()
        except Exception as e:
            logger.error(f"Failed to log AI request: {e}")
            db.rollback()


def get_ai_service() -> AIService:
    return AIService()
