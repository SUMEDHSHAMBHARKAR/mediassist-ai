from fastapi import Depends , HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import models,security,schemas

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_user( token : str = Depends(oauth2_scheme) ,db: Session = Depends(get_db) ):
    payload = security.decode_access_token(token)

    user_id = payload.get("sub")

    if user_id is None:
        raise HTTPException(
            status_code=401, 
            detail= "Invalid access token"
        )
    
    user_id = int(user_id)
    
    user = db.query(models.User).filter(models.User.id == user_id).first()

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    return user


def require_role(required_role):

    def checker(
        current_user = Depends(get_current_user)
    ):

        if current_user.role != required_role.value:
            raise HTTPException(
                status_code=403,
                detail="You are not allowed to perform this action."
            )

        return current_user

    return checker

def get_current_doctor(current_user : models.User = Depends(get_current_user)):
    if current_user.role != schemas.UserRole.doctor:
        raise HTTPException(
            status_code=403,
            detail="ONLY Doctor is allowed "
        ) 
    doctor = current_user.doctor

    if doctor is None:
       raise HTTPException(
        status_code=404,
        detail="Doctor profile not found."
    )

    return doctor

def get_current_patient(current_user : models.User = Depends(get_current_user)):
    if current_user.role != schemas.UserRole.patient:
        raise HTTPException(
            status_code=403,
            detail="ONLY patient is allowed "
        ) 
    patient = current_user.patient

    if patient is None:
        raise HTTPException(
        status_code=404,
        detail="patient profile not found."
    )

    return patient
    
def get_current_admin(current_user : models.User = Depends(get_current_user)):
    if current_user.role != schemas.UserRole.admin:
        raise HTTPException(
            status_code=403,
            detail="ONLY admin is allowed "
        ) 

    return current_user

