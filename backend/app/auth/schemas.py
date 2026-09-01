from pydantic import BaseModel ,EmailStr 
from datetime import date, time
from enum import Enum

class UserRole(str , Enum):
    admin = "Admin"
    doctor = "Doctor"
    patient = "Patient"
        
class UserCreate(BaseModel):
    user_name : str
    email : EmailStr
    password : str 


class UserResponse(BaseModel):
    id: int
    user_name: str
    email: EmailStr
    role: UserRole
    is_active: bool

    patient_profile_exists: bool
    doctor_profile_exists: bool

    model_config = {
        "from_attributes": True
    }

class LoginRequest(BaseModel):
    identifier : str
    password : str

class Token(BaseModel):
    access_token : str
    token_type : str 


class DoctorAccountCreate(BaseModel):
    user_name: str
    email : EmailStr
    password : str
    name : str
    department_id : int
    qualification : str
    experience_years : int
    date_of_birth : date
    phone : str
    consultation_fee : int
    room_number : int