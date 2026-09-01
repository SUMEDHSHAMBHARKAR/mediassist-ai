from pydantic import BaseModel
from typing import Any


# =====================================================
# Standard API Responses
# =====================================================

class SuccessResponse(BaseModel):
    success: bool = True
    message: str


class DeleteResponse(BaseModel):
    success: bool = True
    message: str = "Resource deleted successfully"


class ErrorDetail(BaseModel):
    code: str
    message: str


class ErrorResponse(BaseModel):
    success: bool = False
    error: ErrorDetail
    request_id: str | None = None
