from pydantic import BaseModel , ConfigDict
from datetime import date
from app.billing.models import PaymentStatus


class BillingCreate(BaseModel):
    appointment_id : int
    medicine_charge : int
    test_charge : int
    other_charge :int
    payment_method : str | None = None

class BillingUpdate(BaseModel):
    payment_status : PaymentStatus | None = None
    payment_method : str | None = None
    paid_at : date | None = None

class BillingResponse(BaseModel):
    id : int
    patient_id : int
    doctor_id : int
    appointment_id : int
    consultation_fee : int
    medicine_charge : int
    test_charge : int
    other_charge : int
    total_amount : int
    payment_status : str
    payment_method : str
    created_at : date
    paid_at : date | None
    model_config = ConfigDict(from_attributes=True)