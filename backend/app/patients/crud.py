from sqlalchemy.orm import Session
from app.patients import schemas
from fastapi import HTTPException
from app import models
from app.auth import models as auth_models
from app.auth.schemas import UserRole
from app.core.query_builder import build_query

PATIENT_SEARCH_FIELDS = ["name", "mobile_no", "address"]


def create_patient(db: Session, patient: schemas.PatientCreate):
    db_patient = models.Patient(
        name=patient.name,
        date_of_birth=patient.date_of_birth,
        mobile_no=patient.mobile_no,
        address=patient.address,
        gender=patient.gender
    )
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)

    return db_patient


def get_all_patients(
    db: Session,
    page: int = 1,
    page_size: int = 20,
    search: str | None = None,
    sort_by: str | None = None,
    sort_order: str = "asc",
    filters: dict | None = None,
):
    return build_query(
        db=db,
        model=models.Patient,
        filters=filters,
        search=search,
        search_fields=PATIENT_SEARCH_FIELDS,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )


def get_patients_by_id(db: Session, patient_id: int):
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if patient is None:
        raise HTTPException(
            status_code=404,
            detail=f"Patient of patient_id {patient_id} , Not found"
        )
    return patient


get_patient_by_id = get_patients_by_id


def update_patient(db: Session, patient_id: int, patient_update: schemas.PatientUpdate):
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if patient is None:
        raise HTTPException(status_code=404, detail="404 not found")
    update_data = patient_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(patient, key, value)

    db.commit()
    db.refresh(patient)

    return patient


def delete_patient(db: Session, patient_id: int):
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if patient is None:
        raise HTTPException(status_code=404, detail="404 not found")
    db.delete(patient)

    db.commit()

    return {"message": "Patient deleted successfully"}


def create_patient_profile(db: Session, current_user: auth_models.User, patient_profile: schemas.PatientProfileCreate):
    if current_user.role != UserRole.patient.value:
        raise HTTPException(
            status_code=403,
            detail="you are not a patient"
        )

    if current_user.patient is not None:
        raise HTTPException(
            status_code=400,
            detail="User id has a paitent"
        )

    db_patient = models.Patient(
        **patient_profile.model_dump(),
        user_id=current_user.id
    )
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)

    return db_patient


def get_patient_profile(current_user: auth_models.User):
    if current_user.role != UserRole.patient.value:
        raise HTTPException(
            status_code=403,
            detail="Auth denyed"
        )

    patient = current_user.patient

    if patient is None:
        raise HTTPException(
            status_code=404,
            detail="Patient profile not found"
        )

    return patient


def update_patient_profile(db: Session, current_user: auth_models.User, patient_profile_update: schemas.PatientProfileUpdate):
    if current_user.role != UserRole.patient.value:
        raise HTTPException(
            status_code=403,
            detail="Auth denyed"
        )

    patient = current_user.patient

    if patient is None:
        raise HTTPException(
            status_code=404,
            detail="Patient profile not found"
        )

    update_data = patient_profile_update.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(patient, key, value)

    db.commit()
    db.refresh(patient)

    return patient
