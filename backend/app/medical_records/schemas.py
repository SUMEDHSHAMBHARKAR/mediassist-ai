from datetime import date
from pydantic import BaseModel, Field


# =====================================================
# Base Schema
# =====================================================

class MedicalRecordBase(BaseModel):
    visit_date: date
    chief_complaint: str = Field(min_length=3,max_length=255)
    diagnosis: str = Field(min_length=3)
    treatment: str | None = None
    allergies: str | None = None
    notes: str | None = None


# =====================================================
# Create
# =====================================================

class MedicalRecordCreate(MedicalRecordBase):
    patient_id: int
    doctor_id: int


# =====================================================
# Update
# =====================================================

class MedicalRecordUpdate(BaseModel):
    chief_complaint: str | None = Field(default=None,min_length=3,max_length=255)
    diagnosis: str | None = Field(default=None,min_length=3)
    treatment: str | None = None
    allergies: str | None = None
    notes: str | None = None


# =====================================================
# Response
# =====================================================

class MedicalRecordResponse(MedicalRecordBase):
    id: int
    patient_id: int
    doctor_id: int
    model_config = {
        "from_attributes": True
    }