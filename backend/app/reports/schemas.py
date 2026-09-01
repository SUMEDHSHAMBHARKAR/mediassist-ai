from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field


class ReportType(str, Enum):
    BLOOD_REPORT = "Blood Report"
    MRI = "MRI"
    CT_SCAN = "CT Scan"
    XRAY = "X-Ray"
    ECG = "ECG"
    PRESCRIPTION = "Prescription"
    OTHER = "Other"


class ReportStatus(str, Enum):
    UPLOADED = "Uploaded"
    VERIFIED = "Verified"
    ARCHIVED = "Archived"


# ---------- Base Schema ----------

class ReportBase(BaseModel):
    report_type: ReportType
    notes: str | None = Field(default=None, max_length=1000)


# ---------- Create ----------

class ReportCreate(ReportBase):
    patient_id: int


# ---------- Update ----------

class ReportUpdate(BaseModel):
    notes: str | None = Field(default=None, max_length=1000)
    status: ReportStatus | None = None


# ---------- Response ----------

class ReportResponse(ReportBase):
    id: int
    patient_id: int
    original_filename: str
    stored_filename: str
    file_path: str
    content_type: str
    file_size: int
    version: int
    status: ReportStatus
    uploaded_by: int
    uploaded_at: datetime
    model_config = {
        "from_attributes": True
    }