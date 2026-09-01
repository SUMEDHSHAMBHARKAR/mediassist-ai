from sqlalchemy.orm import Session
from app import models 
from app.schedules import schemas
from fastapi import HTTPException
from datetime import date , datetime 
from app import models as main_models

def create_schedule(db : Session , doctor_id , schedule: schemas.DoctorScheduleCreate):
    doctor = db.query(models.Doctor).filter(models.Doctor.id == doctor_id).first()
    if doctor is None:
        raise HTTPException(
            status_code=  404,
            detail= f"Doctor of id : {schedule.doctor_id} , Not found "
        )
    if schedule.start_time >= schedule.end_time :
        raise HTTPException(
            status_code= 400,
            detail= f"{schedule.end_time} is before {schedule.start_time}" 
        )
    existing_schedule = db.query(models.DoctorSchedule).filter(
        models.DoctorSchedule.doctor_id == doctor_id,
        models.DoctorSchedule.day_of_week == schedule.day_of_week
    ).first()
    if existing_schedule is not None:
        raise HTTPException(
        status_code=409,
        detail=f"Doctor {doctor_id} already has a schedule for {schedule.day_of_week}"
    )
    db_schedule = models.DoctorSchedule(
        doctor_id = doctor_id,
        day_of_week = schedule.day_of_week,
        start_time = schedule.start_time,
        end_time = schedule.end_time,
    )

    db.add(db_schedule)
    db.commit()
    db.refresh(db_schedule)

    return db_schedule

def get_schedule(db : Session , doctor_id : int):
    doctor = db.query(models.Doctor).filter(models.Doctor.id == doctor_id).first()
    if doctor is None:
        raise HTTPException(
        status_code=404,
        detail="Doctor not found"
    )


    return doctor.schedules

def update_schedule(db : Session, schedule, schedule_update : schemas.DoctorScheduleUpdate):
    update_data = schedule_update.model_dump(exclude_unset=True)
    DoctorSchedule = main_models.DoctorSchedule
    for key, value in update_data.items():
        setattr(schedule , key , value)
    
    
    if schedule.start_time >= schedule.end_time:
        raise HTTPException(
            status_code= 400,
            detail=" start time shoud be less than end time"
        )
    
    existing = db.query(DoctorSchedule).filter(
        DoctorSchedule.doctor_id == schedule.doctor_id,
        DoctorSchedule.day_of_week == schedule.day_of_week,
        DoctorSchedule.id != schedule.id
        ).first()

    if existing:
               db.rollback()
               raise HTTPException(
               status_code=409,
               detail="Doctor already has a schedule for this day."
        )

    db.commit()
    db.refresh(schedule)

    return schedule
    

def delete_schedule(db: Session, schedule):
    db.delete(schedule)
    db.commit()

    return {
         "message" : "schedule has been deleted successfully"
    }
    
