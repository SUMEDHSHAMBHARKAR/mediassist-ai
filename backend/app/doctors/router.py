from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.doctors import crud, schemas

router = APIRouter(
    tags=["Doctors"]
)


@router.get("/doctors")
def get_doctors(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    sort_by: str | None = None,
    sort_order: str = Query("asc", pattern="^(asc|desc)$"),
    department_id: int | None = None,
    is_active: bool | None = None,
    db: Session = Depends(get_db),
):
    filters = {}
    if department_id is not None:
        filters["department_id"] = department_id
    if is_active is not None:
        filters["is_active"] = is_active

    return crud.get_all_doctors(
        db=db,
        page=page,
        page_size=page_size,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
        filters=filters,
    )


@router.get("/doctors/{doctor_id}")
def get_doctor_by_id(doctor_id: int, db: Session = Depends(get_db)):
    return crud.get_doctor_by_id(db, doctor_id)


@router.get("/doctors_by_department")
def get_doctors_by_department(department_id: int, db: Session = Depends(get_db)):
    return crud.get_doctors_by_department(db, department_id)


@router.patch("/doctors/{doctor_id}/deactivate")
def deactivate_doctor(doctor_id: int, db: Session = Depends(get_db)):
    return crud.deactivate_doctor(db, doctor_id)


@router.patch("/doctors/{doctor_id}")
def update_doctor(doctor_id: int, doctor_update: schemas.DoctorUpdate, db: Session = Depends(get_db)):
    return crud.update_doctor(db, doctor_id, doctor_update)
