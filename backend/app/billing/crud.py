from sqlalchemy.orm import Session
from app.billing import schemas, models
from fastapi import HTTPException
from app import models as main_models
from app.core.query_builder import build_query

BILLING_SEARCH_FIELDS = ["payment_method"]

def create_billing(db : Session, billing: schemas.BillingCreate):
    appointment = db.query(main_models.Appointment).filter(main_models.Appointment.id == billing.appointment_id).first()
    if appointment is None:
        raise HTTPException(
        status_code=404,
        detail="Appointment not found"
    )
    existing_bill = (db.query(models.Billing).filter(models.Billing.appointment_id == billing.appointment_id).first())
    if existing_bill is not None:
        raise HTTPException(
        status_code=400,
        detail="Billing already exists for this appointment"
    )
    doctor = (db.query(models.Doctor).filter(main_models.Doctor.id == appointment.doctor_id).first())
    if doctor is None:
        raise HTTPException(
        status_code=404,
        detail="Doctor not found"
    )
    total_amount = (doctor.consultation_fee+ billing.medicine_charge + billing.test_charge + billing.other_charge)
    db_billing = models.Billing(
        patient_id=appointment.patient_id,
        doctor_id=appointment.doctor_id,
        appointment_id=appointment.id,
        consultation_fee=doctor.consultation_fee,
        medicine_charge=billing.medicine_charge,
        test_charge=billing.test_charge,
        other_charge=billing.other_charge,
        total_amount=total_amount,
        payment_method=billing.payment_method,
    )

    db.add(db_billing)
    db.commit()
    db.refresh(db_billing)

    return db_billing

def get_billing(db: Session, billing_id: int):
    billing = (db.query(models.Billing).filter(models.Billing.id == billing_id).first())

    if billing is None:
        raise HTTPException(
            status_code=404,
            detail="Billing not found"
        )

    return billing

def get_patient_billings(
    db: Session,
    patient_id: int,
    page: int = 1,
    page_size: int = 20,
    search: str | None = None,
    sort_by: str | None = None,
    sort_order: str = "asc",
    filters: dict | None = None,
):
    base_query = (
        db.query(models.Billing)
        .filter(models.Billing.patient_id == patient_id)
    )

    return build_query(
        db=db,
        model=models.Billing,
        filters=filters,
        search=search,
        search_fields=BILLING_SEARCH_FIELDS,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
        base_query=base_query,
    )

def update_billing(db : Session,billing_id: int,updated_billing: schemas.BillingUpdate):
    billing = db.query(models.Billing).filter(models.Billing.id == billing_id).first()

    if billing is None:
        raise HTTPException(
            status_code=404,
            detail="Billing not found"
        )

    update_data = updated_billing.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(billing, key, value)


    db.commit()
    db.refresh(billing)

    return billing

def delete_billing(db: Session,billing_id: int):
    billing = (
        db.query(models.Billing)
        .filter(models.Billing.id == billing_id)
        .first()
    )

    if billing is None:
        raise HTTPException(
            status_code=404,
            detail="Billing not found"
        )

    db.delete(billing)
    db.commit()

    return {
        "message": "Billing deleted successfully"
    }
