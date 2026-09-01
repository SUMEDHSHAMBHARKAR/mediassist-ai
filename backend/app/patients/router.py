from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.patients import crud, schemas
from app.auth import dependencies, models as auth_models

router = APIRouter(
    tags=["Patient"]
)

@router.post("/patient")
def create_patient(patient: schemas.PatientCreate, db: Session = Depends(get_db)):
    return crud.create_patient(db, patient)

@router.get("/patients")
def get_patients(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    sort_by: str | None = None,
    sort_order: str = Query("asc", pattern="^(asc|desc)$"),
    gender: str | None = None,
    name: str | None = None,
    db: Session = Depends(get_db),
):
    filters = {}
    if gender:
        filters["gender"] = gender
    if name:
        filters["name"] = {"op": "contains", "value": name}

    return crud.get_all_patients(
        db=db,
        page=page,
        page_size=page_size,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
        filters=filters,
    )

@router.get("/patients/profile")
def get_patient_profile( current_user : auth_models.User = Depends(dependencies.get_current_user)):
    return crud.get_patient_profile(current_user)

@router.get("/patients/{patient_id}")
def get_patient_by_id(patient_id: int, db: Session = Depends(get_db)):
    return crud.get_patients_by_id(db, patient_id)

@router.patch("/patients/{patient_id}")
def update_patients(patient_id: int, patient_update: schemas.PatientUpdate, db: Session = Depends(get_db)):
    return crud.update_patient(db, patient_id, patient_update)

@router.delete("/patients/{patient_id}")
def delete_patient(patient_id: int, db: Session = Depends(get_db)):
    return crud.delete_patient(db, patient_id)

@router.post("/profile")
def create_patient_profile(patient_profile : schemas.PatientProfileCreate , db : Session = Depends(get_db), current_user : auth_models.User = Depends(dependencies.get_current_user)):
    return crud.create_patient_profile(db ,current_user , patient_profile)

@router.patch("/patient/profile")
def update_patient_profile(patient_profile_update : schemas.PatientProfileUpdate , current_user : auth_models.User = Depends(dependencies.get_current_user) ,db : Session = Depends(get_db) ):    
    return crud.update_patient_profile(db , current_user ,patient_profile_update)