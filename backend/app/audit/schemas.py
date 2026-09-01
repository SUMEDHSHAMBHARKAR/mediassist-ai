from pydantic import BaseModel
from datetime import datetime


class AuditLogCreate(BaseModel):
    user_id: int | None = None
    action: str
    resource: str
    resource_id: int | None = None
    details: str | None = None
    ip_address: str | None = None
    user_agent: str | None = None
    method: str | None = None
    path: str | None = None
    status_code: int | None = None
    duration_ms: int | None = None


class AuditLogResponse(BaseModel):
    id: int
    user_id: int | None
    action: str
    resource: str
    resource_id: int | None
    details: str | None
    ip_address: str | None
    method: str | None
    path: str | None
    status_code: int | None
    duration_ms: int | None
    created_at: datetime

    model_config = {"from_attributes": True}


class AuditSummary(BaseModel):
    total_actions: int
    actions_today: int
    top_actions: list[dict]
    top_users: list[dict]
