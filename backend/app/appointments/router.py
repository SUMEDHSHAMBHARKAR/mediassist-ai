from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.appointments import crud, schemas
from datetime import date
from fastapi import HTTPException
from app.auth import models as auth_models, schemas as auth_schemas
from app.auth import dependencies, authorization
from app import models

router = APIRouter(
    tags=["Appointments"]
)

@router.post("/appointment")
def create_appointment(appointment: schemas.AppointmentCreate, db: Session = Depends(get_db), current_user: auth_models.User = Depends(dependencies.get_current_user)):
    return crud.create_appointment(db, appointment, current_user)

@router.get("/appointments")
def get_appointments(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    sort_by: str | None = None,
    sort_order: str = Query("asc", pattern="^(asc|desc)$"),
    doctor_id: int | None = None,
    patient_id: int | None = None,
    status: schemas.AppointmentStatus | None = None,
    appointment_date: date | None = None,
    db: Session = Depends(get_db),
    current_user: auth_models.User = Depends(dependencies.get_current_user),
):
    filters = {}
    if doctor_id is not None:
        filters["doctor_id"] = doctor_id
    if patient_id is not None:
        filters["patient_id"] = patient_id
    if status is not None:
        filters["status"] = status.value
    if appointment_date is not None:
        filters["appointment_date"] = appointment_date

    return crud.get_appointments(
        db=db,
        page=page,
        page_size=page_size,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
        filters=filters,
    )

@router.get("/doctor/me/appointments")
def get_appointments_by_doctor( doctor : models.Doctor = Depends(dependencies.get_current_doctor),db : Session = Depends(get_db) ):
    return crud.get_appointments_by_doctor(db , doctor.id )

@router.get("/patient/me/appointments")
def get_appointments_by_patient(patient : models.Patient = Depends(dependencies.get_current_patient) ,db : Session = Depends(get_db)):
    return crud.get_appointments_by_patient(db , patient.id)

    
@router.get("/appointments/upcoming")
def get_upcoming_appointments(doctor_id : int | None = None , db : Session = Depends(get_db)):
    return crud.get_upcoming_appointments(db , doctor_id)

@router.get("/appointments/today")
def get_todays_appointment(doctor_id : int | None = None , db : Session = Depends(get_db)):
    return crud.get_todays_appointment(db , doctor_id)

@router.get("/appointments/{appointment_id}")
def get_appointment_by_id(appointment_id : int , db : Session = Depends(get_db) ,current_user : auth_models.User = Depends(dependencies.get_current_user) ):
    return crud.get_appointment_by_id(db , appointment_id ,current_user)

@router.patch("/appointments/{appointment_id}/status")
def update_appointment_status(appointment_id : int , status_update : schemas.AppointmentStatusUpdate , db : Session = Depends(get_db), current_user: auth_models.User = Depends(dependencies.get_current_user)):
    appointment = crud.get_appointment(db, appointment_id)
    authorization.authorize_appointment_status_update(appointment , current_user)
    return crud.update_appointment_status(db , appointment, status_update)

@router.patch("/appointments/{appointment_id}/reschedule")
def reschedule_appointment(appointment_id , reschedule : schemas.AppointmentReschedule , db :Session = Depends(get_db),current_user : auth_models.User = Depends(dependencies.get_current_user)):
    appointment = crud.get_appointment(db , appointment_id)
    authorization.authorize_appointment_owner(appointment , current_user)
    return crud.reschedule_appointment(db , appointment ,reschedule )

@router.patch("/appointments/{appointment_id}/cancel")
def cancel_appointment(appointment_id: int ,db : Session = Depends(get_db) , current_user : auth_models.User = Depends(dependencies.get_current_user)):
    appointment = crud.get_appointment(db, appointment_id)

    authorization.authorize_appointment_owner(appointment ,current_user)

    if appointment.status == schemas.AppointmentStatus.cancelled:
        raise HTTPException(
        status_code=409,
        detail="Appointment is already cancelled"
        )
    return crud.cancel_appointment(db , appointment )