import os
from pydantic import BaseModel
from dotenv import load_dotenv


# The AI module can be imported independently of other application modules, so
# load the local development settings here before reading AI_* variables.
load_dotenv()


# =====================================================
# AI Configuration
# =====================================================

class AIProviderConfig(BaseModel):
    name: str
    api_key: str | None = None
    base_url: str | None = None
    model: str
    max_tokens: int = 2048
    temperature: float = 0.7
    timeout_seconds: int = 30


class AIConfig(BaseModel):
    enabled: bool = False
    default_provider: str = "openai"
    max_retries: int = 3
    request_timeout: int = 30
    rate_limit_per_minute: int = 60
    cost_tracking_enabled: bool = True
    cache_enabled: bool = True
    cache_ttl_seconds: int = 3600


def get_ai_config() -> AIConfig:
    return AIConfig(
        enabled=os.getenv("AI_ENABLED", "false").lower() == "true",
        default_provider=os.getenv("AI_DEFAULT_PROVIDER", "openai"),
        max_retries=int(os.getenv("AI_MAX_RETRIES", "3")),
        request_timeout=int(os.getenv("AI_REQUEST_TIMEOUT", "30")),
        rate_limit_per_minute=int(os.getenv("AI_RATE_LIMIT", "60")),
        cost_tracking_enabled=os.getenv("AI_COST_TRACKING", "true").lower() == "true",
        cache_enabled=os.getenv("AI_CACHE_ENABLED", "true").lower() == "true",
        cache_ttl_seconds=int(os.getenv("AI_CACHE_TTL", "3600")),
    )


def get_provider_config(provider: str = "openai") -> AIProviderConfig:
    configs = {
        "openai": AIProviderConfig(
            name="openai",
            api_key=os.getenv("OPENAI_API_KEY"),
            base_url=os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1"),
            # A fast, lower-cost default for the in-product assistant. It can
            # be changed without code changes through OPENAI_MODEL.
            model=os.getenv("OPENAI_MODEL", "gpt-5.6-luna"),
            max_tokens=int(os.getenv("OPENAI_MAX_TOKENS", "700")),
            temperature=float(os.getenv("OPENAI_TEMPERATURE", "0.2")),
            timeout_seconds=int(os.getenv("OPENAI_TIMEOUT_SECONDS", "30")),
        ),
        "anthropic": AIProviderConfig(
            name="anthropic",
            api_key=os.getenv("ANTHROPIC_API_KEY"),
            base_url=os.getenv("ANTHROPIC_BASE_URL", "https://api.anthropic.com"),
            model=os.getenv("ANTHROPIC_MODEL", "claude-3-sonnet-20240229"),
        ),
        "local": AIProviderConfig(
            name="local",
            base_url=os.getenv("LOCAL_MODEL_URL", "http://localhost:11434"),
            model=os.getenv("LOCAL_MODEL", "llama3"),
        ),
    }
    return configs.get(provider, configs["openai"])
