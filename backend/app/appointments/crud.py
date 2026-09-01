from sqlalchemy.orm import Session
from app import models
from app.appointments import schemas
from fastapi import HTTPException
from datetime import date, datetime
from app.auth import models as auth_models
from app.auth.schemas import UserRole
from app.core.query_builder import build_query

APPOINTMENT_SEARCH_FIELDS = ["reason", "appointment_type"]

def create_appointment(db : Session ,appointment : schemas.AppointmentCreate , current_user : auth_models.User ):
    if current_user.role != UserRole.patient.value:
        raise HTTPException(
            status_code=403,
            detail="Auth denyed"
        )
    
    patient =  current_user.patient
    
    if patient is None :
        raise HTTPException(
            status_code=404,
            detail="Patient profile not found"
        )
    doctor = db.query(models.Doctor).filter(models.Doctor.id == appointment.doctor_id).first()
    if doctor is None:
        raise HTTPException(
        status_code=404,
        detail=f"Doctor with id {appointment.doctor_id} not found"
    )

    if doctor.is_active == False:
        raise HTTPException(
            status_code= 400,
            detail=f"Doctor of dr_id {doctor.id} is not active any more"
        )

    appointment_datetime = datetime.combine(
        appointment.appointment_date,
        appointment.appointment_time
    )

    current_time = datetime.now()

    if appointment_datetime <= current_time :
        raise HTTPException(
        status_code=400,
        detail="Cannot book an appointment in the past"
    )
    
    appointment_day = appointment.appointment_date.strftime("%A")

    doctor_schedule = db.query(models.DoctorSchedule).filter(
        models.DoctorSchedule.doctor_id == appointment.doctor_id ,
        models.DoctorSchedule.day_of_week == appointment_day
        ).first()

    if doctor_schedule is None:
        raise HTTPException(
            status_code= 400,
            detail= f"doctor is unavailable for {appointment_day}"
        )
    
    if (appointment.appointment_time < doctor_schedule.start_time 
        or 
        appointment.appointment_time >= doctor_schedule.end_time):
        raise HTTPException(
        status_code=400,
        detail="Appointment time is outside doctor's working hours"
    )

    existing_appointment = db.query(models.Appointment).filter(
        models.Appointment.doctor_id == appointment.doctor_id,
        models.Appointment.appointment_date == appointment.appointment_date,
        models.Appointment.appointment_time == appointment.appointment_time,
        models.Appointment.status != schemas.AppointmentStatus.cancelled.value
    ).first()
    if existing_appointment is not None:
        raise HTTPException(
        status_code=409,
        detail="Doctor is already booked for this date and time"
    )
    
    db_appointment = models.Appointment(
        **appointment.model_dump(),
        patient_id = patient.id 
    )
    db.add(db_appointment)
    db.commit()
    db.refresh(db_appointment)

    return db_appointment


def get_appointments(
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
        model=models.Appointment,
        filters=filters,
        search=search,
        search_fields=APPOINTMENT_SEARCH_FIELDS,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )


def get_appointment(db: Session, appointment_id: int):
    appointment = db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()
    if appointment is None:
        raise HTTPException(
            status_code=404,
            detail=f"Appointment with id {appointment_id} not found"
        )
    return appointment

def get_appointment_by_id(db: Session,appointment_id: int , current_user : auth_models.User):
    appointment = db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()  
    if appointment is None:
        raise HTTPException(
        status_code=404,
        detail=f"Appointment with id {appointment_id} not found"
    )
    
    if current_user.role == UserRole.admin.value:
        return appointment
    elif current_user.role != UserRole.patient.value:
        raise HTTPException(
            status_code=403,
            detail="Auth denyed"
        )
    
    patient =  current_user.patient
    
    if patient is None :
        raise HTTPException(
            status_code=404,
            detail="Patient profile not found"
        )

    if appointment.patient_id != patient.id:
        raise HTTPException (
            status_code=403,
            detail="You are not allowed to access this appointment"
        )
    
    return appointment

def get_appointments_by_doctor(db: Session, doctor_id: int):
    appointments = db.query(models.Appointment).filter(models.Appointment.doctor_id == doctor_id).all()
    if not appointments:
        raise HTTPException(
        status_code=404,
        detail=f"Appointments for doctor_id : {doctor_id} , not found"
        )
    return appointments

def get_appointments_by_patient(db: Session,patient_id: int ):
    appointments = db.query(models.Appointment).filter(models.Appointment.patient_id == patient_id).all()
    if not appointments:
        raise HTTPException(
        status_code=404,
        detail=f"Appointments for patient_id : {patient_id} , not found"
        )
    return appointments


def update_appointment_status(db : Session , appointment, status_update : schemas.AppointmentStatusUpdate ):
    appointment.status = status_update.status.value
    db.commit()
    db.refresh(appointment)

    return appointment

def reschedule_appointment(db :Session , appointment , reschedule: schemas.AppointmentReschedule):
    
    new_doctor_id = ( reschedule.doctor_id if reschedule.doctor_id is not None else appointment.doctor_id)
    new_appointment_date = (reschedule.appointment_date if reschedule.appointment_date is not None else appointment.appointment_date)
    new_appointment_time = (reschedule.appointment_time if reschedule.appointment_time is not None else appointment.appointment_time)

    doctor = db.query(models.Doctor).filter(models.Doctor.id == new_doctor_id).first()
    if doctor is None:
        raise HTTPException(
            status_code=404,
            detail="doctor not found"
        )
    if doctor.is_active is False:
        raise HTTPException(
        status_code=400,
        detail=f"Doctor with id {new_doctor_id} is inactive"
    )

    new_appointment_datetime = datetime.combine(
        new_appointment_date,
        new_appointment_time
    )

    current_time = datetime.now()

    if new_appointment_datetime <= current_time :
        raise HTTPException(
        status_code=400,
        detail="Cannot book an appointment in the past"
    )


    new_appointment_day = new_appointment_date.strftime("%A")

    doctor_schedule = db.query(models.DoctorSchedule).filter(
        models.DoctorSchedule.doctor_id == new_doctor_id ,
        models.DoctorSchedule.day_of_week == new_appointment_day
        ).first()

    if doctor_schedule is None:
        raise HTTPException(
            status_code= 400,
            detail= f"doctor is unavailable for {new_appointment_day}"
        )
    
    if (new_appointment_time < doctor_schedule.start_time 
        or 
        new_appointment_time >= doctor_schedule.end_time):
        raise HTTPException(
        status_code=400,
        detail="Appointment time is outside doctor's working hours"
    )

    existing_appointment = db.query(models.Appointment).filter(
        models.Appointment.doctor_id == new_doctor_id,
        models.Appointment.appointment_date == new_appointment_date,
        models.Appointment.appointment_time == new_appointment_time,
        models.Appointment.status != schemas.AppointmentStatus.cancelled.value,
        models.Appointment.id != appointment.id
        ).first()

    if existing_appointment is not None:
        raise HTTPException(
        status_code=409,
        detail="Doctor is already booked for this date and time"
        )
    
    appointment.doctor_id = new_doctor_id
    appointment.appointment_date = new_appointment_date
    appointment.appointment_time = new_appointment_time

    db.commit()
    db.refresh(appointment)

    return appointment

def get_upcoming_appointments(db: Session, doctor_id: int | None = None):
    today = date.today()

    query = db.query(models.Appointment).filter(
        models.Appointment.status != schemas.AppointmentStatus.cancelled.value,
        models.Appointment.appointment_date >= today,
    )

    if doctor_id is not None:
        query = query.filter(models.Appointment.doctor_id == doctor_id)

    return (
        query
        .order_by(models.Appointment.appointment_date.asc(), models.Appointment.appointment_time.asc())
        .all()
    )

def get_todays_appointment(db :Session , doctor_id : int | None = None):
    today = date.today()

    query = db.query(models.Appointment).filter(
        models.Appointment.appointment_date == today ,
        models.Appointment.status != schemas.AppointmentStatus.cancelled.value
    )

    if doctor_id is not None:
        query = query.filter(models.Appointment.doctor_id == doctor_id)

    todays_appointment = query.all()

    return todays_appointment


def cancel_appointment(db : Session , appointment ): 
    appointment.status = schemas.AppointmentStatus.cancelled
    db.commit()
    db.refresh(appointment)

    return appointment

