from sqlalchemy.orm import Session
from app import models
from app.doctors import schemas
from fastapi import HTTPException
from datetime import date, datetime
from app.core.query_builder import build_query

DOCTOR_SEARCH_FIELDS = ["name", "email", "phone", "qualification"]


def create_doctor(db: Session, doctor: schemas.DoctorCreate):
    db_doctor = models.Doctor(
        name=doctor.name,
        department_id=doctor.department_id,
        qualification=doctor.qualification,
        experience_years=doctor.experience_years,
        date_of_birth=doctor.date_of_birth,
        phone=doctor.phone,
        email=doctor.email,
        consultation_fee=doctor.consultation_fee,
        room_number=doctor.room_number,
    )
    db.add(db_doctor)
    db.commit()
    db.refresh(db_doctor)

    return db_doctor


def get_all_doctors(
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
        model=models.Doctor,
        filters=filters,
        search=search,
        search_fields=DOCTOR_SEARCH_FIELDS,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )

def get_doctor_by_id(db : Session , doctor_id : int):
    doctor = db.query(models.Doctor).filter(models.Doctor.id == doctor_id).first()
    if doctor is None:
        raise HTTPException(
            status_code= 404,
            detail = f"Doctor of dr_id {doctor_id} , Not found"
        )
    return doctor

def get_doctors_by_department(db : Session, department_id :int):
    department = db.query(models.Department).filter(models.Department.id == department_id).first()
    if department is None:
        raise HTTPException(
            status_code= 404,
            detail= f"Department no {department_id} dose not exist"
        )
    doctors = db.query(models.Doctor).filter(models.Doctor.department_id == department_id).all()
    if not doctors:
        raise HTTPException(
            status_code= 404,
            detail= f"There are no doctors in department no :{department_id}"
        )
    return doctors

def update_doctor(db : Session , doctor_id : int ,doctor_update : schemas.DoctorUpdate):
    doctor = db.query(models.Doctor).filter(models.Doctor.id == doctor_id).first()
    if doctor is None:
        raise HTTPException(
            status_code= 404,
            detail= f"doctor id : {doctor_id} dose not exist"
        )
    if doctor_update.department_id is not None:
        department = db.query(models.Department).filter(models.Department.id == doctor_update.department_id).first()
        if department is None :
            raise HTTPException(
            status_code= 404,
            detail=  f"department no : {doctor_update.department_id} not found"
            )
    update_data = doctor_update.model_dump(exclude_unset=True)
    for key , value in update_data.items() :
        setattr(doctor , key , value )
    
    db.commit()
    db.refresh(doctor)

    return doctor

def deactivate_doctor(db: Session, doctor_id: int):
    doctor = db.query(models.Doctor).filter(models.Doctor.id == doctor_id).first()
    if doctor is None:
        raise HTTPException(
            status_code=404,
            detail=f"Doctor of dr_id {doctor_id} not found"
        )
    
    doctor.is_active = False

    db.commit()
    db.refresh(doctor)

    return doctor

    