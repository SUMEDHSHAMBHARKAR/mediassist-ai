from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.doctors import crud as doctor_crud
from app.patients import crud as patient_crud
from app.medical_records import crud as medical_record_crud

from app.prescriptions import (
    crud,
    models,
    schemas,
)


# =====================================================
# Create Prescription
# =====================================================

def create_prescription(
    db: Session,
    prescription: schemas.PrescriptionCreate,
) -> models.Prescription:

    # -------------------------------
    # Validate Patient
    # -------------------------------

    patient = patient_crud.get_patients_by_id(
        db=db,
        patient_id=prescription.patient_id,
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
        doctor_id=prescription.doctor_id,
    )

    if doctor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found.",
        )

    # -------------------------------
    # Validate Medical Record
    # -------------------------------

    medical_record = medical_record_crud.get_medical_record_by_id(
        db=db,
        medical_record_id=prescription.medical_record_id,
    )

    if medical_record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medical record not found.",
        )

    # -------------------------------
    # Create Prescription with Items
    # -------------------------------

    db_prescription = models.Prescription(
        patient_id=prescription.patient_id,
        doctor_id=prescription.doctor_id,
        medical_record_id=prescription.medical_record_id,
        prescription_date=prescription.prescription_date,
        diagnosis=prescription.diagnosis,
        instructions=prescription.instructions,
        follow_up_date=prescription.follow_up_date,
        status=prescription.status,
    )

    for item in prescription.prescription_items:
        db_item = models.PrescriptionItem(
            medicine_name=item.medicine_name,
            dosage=item.dosage,
            frequency=item.frequency,
            duration=item.duration,
            route=item.route,
            notes=item.notes,
        )
        db_prescription.prescription_items.append(db_item)

    return crud.create_prescription(
        db=db,
        prescription=db_prescription,
    )


# =====================================================
# Get Prescription
# =====================================================

def get_prescription(
    db: Session,
    prescription_id: int,
) -> models.Prescription:

    prescription = crud.get_prescription_by_id(
        db=db,
        prescription_id=prescription_id,
    )

    if prescription is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prescription not found.",
        )

    return prescription


# =====================================================
# Get Patient Prescriptions
# =====================================================

def get_patient_prescriptions(
    db: Session,
    patient_id: int,
    page: int = 1,
    page_size: int = 20,
    search: str | None = None,
    sort_by: str | None = None,
    sort_order: str = "asc",
):

    patient = patient_crud.get_patients_by_id(
        db=db,
        patient_id=patient_id,
    )

    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found.",
        )

    return crud.get_patient_prescriptions(
        db=db,
        patient_id=patient_id,
        page=page,
        page_size=page_size,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
    )


# =====================================================
# Get Doctor Prescriptions
# =====================================================

def get_doctor_prescriptions(
    db: Session,
    doctor_id: int,
    page: int = 1,
    page_size: int = 20,
    search: str | None = None,
    sort_by: str | None = None,
    sort_order: str = "asc",
):

    doctor = doctor_crud.get_doctor_by_id(
        db=db,
        doctor_id=doctor_id,
    )

    if doctor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found.",
        )

    return crud.get_doctor_prescriptions(
        db=db,
        doctor_id=doctor_id,
        page=page,
        page_size=page_size,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
    )


# =====================================================
# Update Prescription
# =====================================================

def update_prescription(
    db: Session,
    prescription_id: int,
    update_data: schemas.PrescriptionUpdate,
) -> models.Prescription:

    prescription = crud.get_prescription_by_id(
        db=db,
        prescription_id=prescription_id,
    )

    if prescription is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prescription not found.",
        )

    update_fields = update_data.model_dump(
        exclude_unset=True,
        exclude={"prescription_items"},
    )

    for field, value in update_fields.items():
        setattr(prescription, field, value)

    # -------------------------------
    # Update Items if Provided
    # -------------------------------

    if update_data.prescription_items is not None:
        prescription.prescription_items.clear()

        for item in update_data.prescription_items:
            db_item = models.PrescriptionItem(
                medicine_name=item.medicine_name,
                dosage=item.dosage,
                frequency=item.frequency,
                duration=item.duration,
                route=item.route,
                notes=item.notes,
            )
            prescription.prescription_items.append(db_item)

    return crud.update_prescription(
        db=db,
        prescription=prescription,
    )


# =====================================================
# Delete Prescription
# =====================================================

def delete_prescription(
    db: Session,
    prescription_id: int,
):

    prescription = crud.get_prescription_by_id(
        db=db,
        prescription_id=prescription_id,
    )

    if prescription is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prescription not found.",
        )

    crud.delete_prescription(
        db=db,
        prescription=prescription,
    )

    return {
        "message": "Prescription deleted successfully."
    }
