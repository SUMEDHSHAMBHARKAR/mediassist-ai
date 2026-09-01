from fastapi import Depends,APIRouter , HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schedules import schemas
from app.schedules import crud
from app.auth import dependencies,schemas as auth_schema, models as auth_models
from app import models as main_models

router = APIRouter(
    tags=["schedules"]
)


@router.post("/doctor-schedules")
def create_doctor_schedules(schedule : schemas.DoctorScheduleCreate , db : Session = Depends(get_db)):
    if not schedule.doctor_id:
        raise HTTPException(status_code=400, detail="doctor_id is required")
    return crud.create_schedule(db, schedule.doctor_id, schedule)

@router.get("/doctors/me/schedules")
def get_schedule(current_user : auth_models.User = Depends(dependencies.get_current_user) , db :Session = Depends(get_db)):
    if current_user.role != auth_schema.UserRole.doctor:
        raise HTTPException(
            status_code= 403,
            detail="only doctor can access"
        )
    doctorID = current_user.doctor.id

    if doctorID is None:
        raise HTTPException(
        status_code=404,
        detail="Doctor profile not found"
    )

    return crud.get_schedule(db , doctorID)

@router.get ("/doctors/{doctor_id}/schedules")
def get_schedule(doctor_id :int, db : Session = Depends(get_db)):
    return crud.get_schedule(db , doctor_id)

@router.post("/admin/doctors/{doctor_id}/schedules")
def create_doctor_shedule_admin(doctor_id : int , schedule : schemas.DoctorScheduleCreate ,db : Session = Depends(get_db) , current_user = Depends(dependencies.get_current_user)):
    if current_user.role != auth_schema.UserRole.admin:
        raise HTTPException(
            status_code= 403,
            detail="only admin can access"
        )
    return crud.create_schedule(db ,doctor_id ,schedule)

@router.post("/doctor/me/schedule")
def create_doctor_shedule(schedule : schemas.DoctorScheduleCreate, db : Session = Depends(get_db) ,current_user : auth_models.User = Depends(dependencies.get_current_user)):
    if current_user.role != auth_schema.UserRole.doctor:
        raise HTTPException(
            status_code=403,
            detail="Only doctors can create schedules."
        )
    return crud.create_schedule(db = db , doctor_id=current_user.doctor.id , schedule = schedule)


@router.patch("/schedules/{schedule_id}")
def update_schedule(schedule_id : int , schedule_update : schemas.DoctorScheduleUpdate ,db : Session = Depends(get_db) ,  current_user : auth_models.User = Depends(dependencies.get_current_user)):
    schedule = db.query(main_models.DoctorSchedule).filter(main_models.DoctorSchedule.id == schedule_id).first()
    if schedule is None:
        raise HTTPException(
            status_code=404,
            detail="Schedule not found"
        )
    if current_user.role == auth_schema.UserRole.admin:
        pass
    elif current_user.role == auth_schema.UserRole.doctor:
        doctor =  current_user.doctor
        if doctor is None:
            raise HTTPException(
                status_code=404,
                detail="Doctor profile not found"
            )
        if schedule.doctor_id != doctor.id:
            raise HTTPException (
                status_code=403,
                detail="You are not allowed to change this schedule"
            )
    else: 
        raise HTTPException(
            status_code=403,
            detail= "access denied"
        )    
    return crud.update_schedule(db , schedule , schedule_update )

@router.delete("/schedules/{schedule_id}")
def delete_schedule(schedule_id : int , db : Session = Depends(get_db) , current_user : auth_models.User = Depends(dependencies.get_current_user)):
    schedule = db.query(main_models.DoctorSchedule).filter(main_models.DoctorSchedule.id == schedule_id).first()
    if schedule is None:
        raise HTTPException(
            status_code=404,
            detail="Schedule not found"
        )
    if current_user.role == auth_schema.UserRole.admin:
        pass
    elif current_user.role == auth_schema.UserRole.doctor:
        doctor =  current_user.doctor
        if doctor is None:
            raise HTTPException(
                status_code=404,
                detail="Doctor profile not found"
            )
        if schedule.doctor_id != doctor.id:
            raise HTTPException (
                status_code=403,
                detail="You are not allowed to delete this schedule"
            )
    else: 
        raise HTTPException(
            status_code=403,
            detail= "access denied"
        )    
    return crud.delete_schedule(db , schedule)