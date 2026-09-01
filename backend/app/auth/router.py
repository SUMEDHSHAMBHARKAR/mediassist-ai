from fastapi import APIRouter, Depends, HTTPException
from app.auth import crud, schemas, security
from sqlalchemy.orm import Session
from app.database import get_db
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from app.auth.dependencies import get_current_user, require_role
from app.auth import models, dependencies
from app.security.authorization import rate_limit_login
from pydantic import BaseModel


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class TokenPairResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str


@router.post("/register", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.create_user(db, user)
    return schemas.UserResponse(
        id=db_user.id,
        user_name=db_user.user_name,
        email=db_user.email,
        role=db_user.role,
        is_active=db_user.is_active,
        patient_profile_exists=db_user.patient is not None,
        doctor_profile_exists=db_user.doctor is not None,
    )


@router.post("/login", response_model=TokenPairResponse)
def authenticate_user(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
    _rate_limit=Depends(rate_limit_login),
):
    login_data = schemas.LoginRequest(
        identifier=form_data.username,
        password=form_data.password,
    )

    user = crud.authenticate_user(db, login_data)

    access_token = security.create_access_token({"sub": str(user.id)})
    refresh_token = security.create_refresh_token({"sub": str(user.id)})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@router.post("/refresh", response_model=TokenPairResponse)
def refresh_access_token(
    body: RefreshTokenRequest,
    db: Session = Depends(get_db),
):
    payload = security.decode_refresh_token(body.refresh_token)
    user_id = payload.get("sub")

    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=401, detail="User is inactive")

    access_token = security.create_access_token({"sub": str(user.id)})
    refresh_token = security.create_refresh_token({"sub": str(user.id)})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user=Depends(get_current_user)):
    return schemas.UserResponse(
        id=current_user.id,
        user_name=current_user.user_name,
        email=current_user.email,
        role=current_user.role,
        is_active=current_user.is_active,
        patient_profile_exists=current_user.patient is not None,
        doctor_profile_exists=current_user.doctor is not None,
    )


@router.post("/admin/doctors")
def create_doctor_account(
    doctor: schemas.DoctorAccountCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(dependencies.get_current_user),
):
    if current_user.role != schemas.UserRole.admin.value:
        raise HTTPException(
            status_code=403,
            detail="Only admins can create doctor accounts",
        )
    return crud.create_doctor_account(db, doctor)
