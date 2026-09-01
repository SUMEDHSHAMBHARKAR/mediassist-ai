from pydantic import BaseModel
from datetime import datetime
from enum import Enum


# =====================================================
# AI Task Types
# =====================================================

class AITaskType(str, Enum):
    chat = "chat"
    summarize = "summarize"
    analyze_report = "analyze_report"
    ocr = "ocr"
    search = "search"
    diagnosis_assist = "diagnosis_assist"


class AITaskStatus(str, Enum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"


# =====================================================
# Request Schemas
# =====================================================

class AICompletionRequest(BaseModel):
    prompt: str
    task_type: AITaskType = AITaskType.chat
    context: dict | None = None
    max_tokens: int | None = None
    temperature: float | None = None
    stream: bool = False


class AISearchRequest(BaseModel):
    query: str
    collection: str = "medical_records"
    top_k: int = 5
    filters: dict | None = None


class AIOCRRequest(BaseModel):
    file_path: str
    extract_fields: list[str] | None = None


class AIRAGRequest(BaseModel):
    query: str
    patient_id: int | None = None
    context_type: str = "medical_history"
    top_k: int = 5


# =====================================================
# Response Schemas
# =====================================================

class AICompletionResponse(BaseModel):
    content: str
    task_type: AITaskType
    model: str
    tokens_used: int
    cost_estimate: float | None = None
    cached: bool = False
    duration_ms: int


class AISearchResult(BaseModel):
    content: str
    score: float
    metadata: dict


class AISearchResponse(BaseModel):
    results: list[AISearchResult]
    query: str
    total_results: int


class AIOCRResponse(BaseModel):
    extracted_text: str
    structured_data: dict | None = None
    confidence: float


class AIUsageStats(BaseModel):
    total_requests: int
    total_tokens: int
    total_cost: float
    requests_today: int
    average_latency_ms: float
