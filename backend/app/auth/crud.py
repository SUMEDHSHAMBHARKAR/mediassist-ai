from sqlalchemy.orm import Session 
from app.auth import models , schemas , security
from fastapi import HTTPException , Depends
from sqlalchemy import or_
from app.database import get_db
from fastapi.security import OAuth2PasswordBearer
from app import models as main_models

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def create_user_with_role(db: Session,user_name: str,email: str,password: str, role: schemas.UserRole):
    user_exist = db.query(models.User).filter(models.User.user_name == user_name).first()
    if user_exist is not None:
        raise HTTPException(
            status_code=409,
            detail="username is already taken"
        )
    user_email_exist = db.query(models.User).filter(models.User.email == email).first()
    if user_email_exist is not None:
        raise HTTPException(
            status_code=409,
            detail="Email is already registered"
        )
    hashed_password = security.hash_password(password)
    db_user = models.User(
        user_name = user_name,
        email = email,
        hashed_password = hashed_password,
        role = role.value
    )

    db.add(db_user)
    db.flush()

    return db_user

def create_user(db: Session , user : schemas.UserCreate):
    db_user =  create_user_with_role(
        db=db ,
        user_name=user.user_name,
        email=user.email,
        password=user.password,
        role=schemas.UserRole.patient 
    )
    db.commit()
    db.refresh(db_user)

    return db_user

def authenticate_user(db : Session , login_data : schemas.LoginRequest):
    user = db.query(models.User).filter( or_(models.User.email == login_data.identifier , models.User.user_name == login_data.identifier)).first()
    if user is None:
        raise HTTPException(
            status_code= 401,
            detail="Invalid username/email or password"
        )
    verify = security.verify_password(login_data.password , user.hashed_password)
    if verify is False:
        raise HTTPException(
            status_code= 401,
            detail="Invalid username/email or password"
        )
    if user.is_active is False:
        raise HTTPException(status_code= 401, detail= "user is inactive")
    
    return user

def create_doctor_account(db: Session, doctor: schemas.DoctorAccountCreate):
    db_user = create_user_with_role(
        db=db,
        user_name=doctor.user_name,
        email=doctor.email,
        password=doctor.password,
        role=schemas.UserRole.doctor
    )

    db_doctor = main_models.Doctor(
        name=doctor.name,
        department_id=doctor.department_id,
        qualification=doctor.qualification,
        experience_years=doctor.experience_years,
        date_of_birth=doctor.date_of_birth,
        phone=doctor.phone,
        consultation_fee=doctor.consultation_fee,
        room_number=doctor.room_number,
        user_id=db_user.id
    ) 
    db.add(db_doctor)
    db.commit()
    db.refresh(db_doctor)

    return db_doctor

def get_user_by_id(db: Session , user_id : int):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    return user