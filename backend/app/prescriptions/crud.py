from sqlalchemy.orm import Session, selectinload, joinedload
from app.prescriptions import models
from app.core.query_builder import build_query

PRESCRIPTION_SEARCH_FIELDS = ["diagnosis", "instructions", "status"]


# =====================================================
# Create
# =====================================================

def create_prescription(
    db: Session,
    prescription: models.Prescription,
) -> models.Prescription:
    db.add(prescription)
    db.commit()
    db.refresh(prescription)
    return prescription


# =====================================================
# Read
# =====================================================

def get_prescription_by_id(
    db: Session,
    prescription_id: int,
) -> models.Prescription | None:
    return (
        db.query(models.Prescription)
        .options(selectinload(models.Prescription.prescription_items))
        .filter(models.Prescription.id == prescription_id)
        .first()
    )


def get_patient_prescriptions(
    db: Session,
    patient_id: int,
    page: int = 1,
    page_size: int = 20,
    search: str | None = None,
    sort_by: str | None = None,
    sort_order: str = "asc",
):
    base_query = (
        db.query(models.Prescription)
        .options(selectinload(models.Prescription.prescription_items))
        .filter(models.Prescription.patient_id == patient_id)
    )

    return build_query(
        db=db,
        model=models.Prescription,
        search=search,
        search_fields=PRESCRIPTION_SEARCH_FIELDS,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
        base_query=base_query,
    )


def get_doctor_prescriptions(
    db: Session,
    doctor_id: int,
    page: int = 1,
    page_size: int = 20,
    search: str | None = None,
    sort_by: str | None = None,
    sort_order: str = "asc",
):
    base_query = (
        db.query(models.Prescription)
        .options(selectinload(models.Prescription.prescription_items))
        .filter(models.Prescription.doctor_id == doctor_id)
    )

    return build_query(
        db=db,
        model=models.Prescription,
        search=search,
        search_fields=PRESCRIPTION_SEARCH_FIELDS,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
        base_query=base_query,
    )


# =====================================================
# Update
# =====================================================

def update_prescription(
    db: Session,
    prescription: models.Prescription,
) -> models.Prescription:
    db.commit()
    db.refresh(prescription)
    return prescription


# =====================================================
# Delete
# =====================================================

def delete_prescription(
    db: Session,
    prescription: models.Prescription,
) -> None:
    db.delete(prescription)
    db.commit()
