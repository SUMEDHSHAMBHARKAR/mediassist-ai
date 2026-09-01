from sqlalchemy.orm import Session, joinedload, selectinload
from app.medical_records import models
from app.core.query_builder import build_query

MEDICAL_RECORD_SEARCH_FIELDS = ["chief_complaint", "diagnosis", "treatment", "notes"]


# =====================================================
# Create
# =====================================================

def create_medical_record(db: Session, medical_record: models.MedicalRecord) -> models.MedicalRecord:

    db.add(medical_record)
    db.commit()
    db.refresh(medical_record)

    return medical_record


# =====================================================
# Read
# =====================================================

def get_medical_record_by_id(db: Session, medical_record_id: int) -> models.MedicalRecord | None:

    return (
        db.query(models.MedicalRecord)
        .options(
            selectinload(models.MedicalRecord.prescriptions),
        )
        .filter(models.MedicalRecord.id == medical_record_id)
        .first()
    )


def get_patient_medical_records(
    db: Session,
    patient_id: int,
    page: int = 1,
    page_size: int = 20,
    search: str | None = None,
    sort_by: str | None = None,
    sort_order: str = "asc",
):
    base_query = (
        db.query(models.MedicalRecord)
        .filter(models.MedicalRecord.patient_id == patient_id)
    )

    return build_query(
        db=db,
        model=models.MedicalRecord,
        search=search,
        search_fields=MEDICAL_RECORD_SEARCH_FIELDS,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
        base_query=base_query,
    )


def get_doctor_medical_records(db: Session, doctor_id: int) -> list[models.MedicalRecord]:

    return (
        db.query(models.MedicalRecord)
        .filter(models.MedicalRecord.doctor_id == doctor_id)
        .order_by(models.MedicalRecord.visit_date.desc())
        .all()
    )


# =====================================================
# Update
# =====================================================

def update_medical_record(db: Session, medical_record: models.MedicalRecord) -> models.MedicalRecord:
    db.commit()
    db.refresh(medical_record)
    return medical_record


# =====================================================
# Delete
# =====================================================

def delete_medical_record(db: Session, medical_record: models.MedicalRecord) -> None:
    db.delete(medical_record)
    db.commit()


def get_latest_medical_record(db: Session, patient_id: int) -> models.MedicalRecord | None:
    return (
        db.query(models.MedicalRecord)
        .filter(models.MedicalRecord.patient_id == patient_id)
        .order_by(models.MedicalRecord.visit_date.desc())
        .first()
    )


def get_patient_record_by_doctor(db: Session, patient_id: int, doctor_id: int):

    return (
        db.query(models.MedicalRecord)
        .filter(
            models.MedicalRecord.patient_id == patient_id,
            models.MedicalRecord.doctor_id == doctor_id,
        )
        .order_by(models.MedicalRecord.visit_date.desc())
        .all()
    )
