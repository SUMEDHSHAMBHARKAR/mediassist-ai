import logging
from abc import ABC, abstractmethod

from fastapi import HTTPException, status

from app.ai.config import AIProviderConfig
from app.ai.schemas import AICompletionRequest, AICompletionResponse, AITaskType

logger = logging.getLogger("ai.provider")


# =====================================================
# Abstract Base Provider
# =====================================================

class BaseAIProvider(ABC):
    def __init__(self, config: AIProviderConfig):
        self.config = config
        self.name = config.name

    @abstractmethod
    def complete(self, request: AICompletionRequest) -> AICompletionResponse:
        pass

    @abstractmethod
    def is_available(self) -> bool:
        pass


# =====================================================
# OpenAI Provider
# =====================================================

class OpenAIProvider(BaseAIProvider):
    def complete(self, request: AICompletionRequest) -> AICompletionResponse:
        if not self.config.api_key:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="OpenAI is not configured. Set OPENAI_API_KEY in backend/.env.",
            )

        try:
            from openai import OpenAI
        except ImportError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="OpenAI SDK is not installed. Run pip install -r requirments.txt.",
            ) from exc

        from app.ai.prompts import SYSTEM_PROMPTS

        instructions = SYSTEM_PROMPTS["medical_assistant"]
        if request.task_type == AITaskType.summarize:
            instructions = SYSTEM_PROMPTS["summarizer"]
        elif request.task_type == AITaskType.analyze_report:
            instructions = SYSTEM_PROMPTS["report_analyzer"]

        context = request.context or {}
        context_note = ""
        if context:
            # Context is explicitly supplied by the authenticated caller; never
            # fetch or expose unrelated records from the provider layer.
            context_note = f"\n\nVerified application context:\n{context}"

        client = OpenAI(
            api_key=self.config.api_key,
            base_url=self.config.base_url,
            timeout=self.config.timeout_seconds,
        )
        try:
            response = client.responses.create(
                model=self.config.model,
                instructions=instructions,
                input=f"User request:\n{request.prompt}{context_note}",
                max_output_tokens=request.max_tokens or self.config.max_tokens,
                # Do not retain clinical conversation data in the provider by default.
                store=False,
            )
        except Exception as exc:
            # Keep the full traceback on the server, but give the local UI a
            # useful, non-secret reason for a provider-side failure.
            logger.exception("OpenAI Responses API request failed")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"OpenAI request failed: {exc}",
            ) from exc

        usage = getattr(response, "usage", None)
        total_tokens = getattr(usage, "total_tokens", 0) if usage else 0
        return AICompletionResponse(
            content=response.output_text or "I could not generate a response.",
            task_type=request.task_type,
            model=self.config.model,
            tokens_used=total_tokens,
            duration_ms=0,
        )

    def is_available(self) -> bool:
        return self.config.api_key is not None


# =====================================================
# Anthropic Provider (Infrastructure Only)
# =====================================================

class AnthropicProvider(BaseAIProvider):
    def complete(self, request: AICompletionRequest) -> AICompletionResponse:
        logger.info(f"Anthropic completion requested: {request.task_type}")
        raise NotImplementedError(
            "Anthropic provider not connected. Set ANTHROPIC_API_KEY and AI_ENABLED=true"
        )

    def is_available(self) -> bool:
        return self.config.api_key is not None


# =====================================================
# Local Model Provider (Infrastructure Only)
# =====================================================

class LocalModelProvider(BaseAIProvider):
    def complete(self, request: AICompletionRequest) -> AICompletionResponse:
        logger.info(f"Local model completion requested: {request.task_type}")
        raise NotImplementedError(
            "Local model provider not connected. Ensure model server is running."
        )

    def is_available(self) -> bool:
        return self.config.base_url is not None


# =====================================================
# Provider Registry
# =====================================================

PROVIDER_REGISTRY = {
    "openai": OpenAIProvider,
    "anthropic": AnthropicProvider,
    "local": LocalModelProvider,
}


def get_provider(config: AIProviderConfig) -> BaseAIProvider:
    provider_class = PROVIDER_REGISTRY.get(config.name)
    if provider_class is None:
        raise ValueError(f"Unknown AI provider: {config.name}")
    return provider_class(config)
