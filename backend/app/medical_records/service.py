from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.doctors import crud as doctor_crud

from app.medical_records import (
    crud,
    models,
    schemas,
)

from app.patients import crud as patient_crud
from app.auth import crud as auth_crud


# =====================================================
# Create Medical Record
# =====================================================

def create_medical_record(
    db: Session,
    medical_record: schemas.MedicalRecordCreate,
) -> models.MedicalRecord:

    # -------------------------------
    # Validate Patient
    # -------------------------------

    patient = patient_crud.get_patient_by_id(
        db=db,
        patient_id=medical_record.patient_id,
    )

    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found.",
        )

    # -------------------------------
    # Validate Doctor
    # -------------------------------

    doctor = doctor_crud.get_doctor_by_id(
        db=db,
        doctor_id=medical_record.doctor_id,
    )

    if doctor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found.",
        )

    # -------------------------------
    # Create Model
    # -------------------------------

    db_record = models.MedicalRecord(
        patient_id=medical_record.patient_id,
        doctor_id=medical_record.doctor_id,
        visit_date=medical_record.visit_date,
        chief_complaint=medical_record.chief_complaint,
        diagnosis=medical_record.diagnosis,
        treatment=medical_record.treatment,
        allergies=medical_record.allergies,
        notes=medical_record.notes,
    )

    return crud.create_medical_record(
        db=db,
        medical_record=db_record,
    )


# =====================================================
# Get Medical Record
# =====================================================

def get_medical_record(
    db: Session,
    medical_record_id: int,
) -> models.MedicalRecord:

    medical_record = crud.get_medical_record_by_id(
        db=db,
        medical_record_id=medical_record_id,
    )

    if medical_record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medical record not found.",
        )

    return medical_record


# =====================================================
# Get Patient Medical Records
# =====================================================

def get_patient_medical_records(
    db: Session,
    patient_id: int,
    page: int = 1,
    page_size: int = 20,
    search: str | None = None,
    sort_by: str | None = None,
    sort_order: str = "asc",
):

    patient = patient_crud.get_patient_by_id(
        db=db,
        patient_id=patient_id,
    )

    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found.",
        )

    return crud.get_patient_medical_records(
        db=db,
        patient_id=patient_id,
        page=page,
        page_size=page_size,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
    )


# =====================================================
# Update Medical Record
# =====================================================

def update_medical_record(
    db: Session,
    medical_record_id: int,
    update_data: schemas.MedicalRecordUpdate,
):

    medical_record = crud.get_medical_record_by_id(
        db=db,
        medical_record_id=medical_record_id,
    )

    if medical_record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medical record not found.",
        )

    update_fields = update_data.model_dump(
        exclude_unset=True,
        exclude_none=True,
    )

    for field, value in update_fields.items():
        setattr(
            medical_record,
            field,
            value,
        )

    return crud.update_medical_record(
        db=db,
        medical_record=medical_record,
    )


# =====================================================
# Delete Medical Record
# =====================================================

def delete_medical_record(
    db: Session,
    medical_record_id: int,
):

    medical_record = crud.get_medical_record_by_id(
        db=db,
        medical_record_id=medical_record_id,
    )

    if medical_record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medical record not found.",
        )

    crud.delete_medical_record(
        db=db,
        medical_record=medical_record,
    )

    return {
        "message": "Medical record deleted successfully."
    }