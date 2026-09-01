from pydantic import BaseModel, ConfigDict, Field
from datetime import date


# =====================================================
# Prescription Item Schemas
# =====================================================

class PrescriptionItemCreate(BaseModel):
    medicine_name: str = Field(min_length=1, max_length=255)
    dosage: str = Field(min_length=1, max_length=100)
    frequency: str = Field(min_length=1, max_length=100)
    duration: str = Field(min_length=1, max_length=100)
    route: str | None = None
    notes: str | None = None


class PrescriptionItemResponse(BaseModel):
    id: int
    prescription_id: int
    medicine_name: str
    dosage: str
    frequency: str
    duration: str
    route: str | None = None
    notes: str | None = None
    model_config = ConfigDict(from_attributes=True)


# =====================================================
# Prescription Schemas
# =====================================================

class PrescriptionBase(BaseModel):
    patient_id: int
    doctor_id: int
    medical_record_id: int
    prescription_date: date
    diagnosis: str = Field(min_length=3)
    instructions: str | None = None
    follow_up_date: date | None = None
    status: str = "active"


class PrescriptionCreate(PrescriptionBase):
    prescription_items: list[PrescriptionItemCreate] = Field(min_length=1)


class PrescriptionUpdate(BaseModel):
    diagnosis: str | None = Field(default=None, min_length=3)
    instructions: str | None = None
    follow_up_date: date | None = None
    status: str | None = None
    prescription_items: list[PrescriptionItemCreate] | None = None


class PrescriptionResponse(PrescriptionBase):
    id: int
    created_at: date
    prescription_items: list[PrescriptionItemResponse] = []
    model_config = ConfigDict(from_attributes=True)
