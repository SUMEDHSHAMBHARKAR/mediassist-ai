from pydantic import BaseModel ,EmailStr 
from datetime import date


class DoctorCreate(BaseModel):
    name : str
    department_id : int
    qualification : str
    experience_years : int
    date_of_birth : date
    phone : str
    email : EmailStr
    consultation_fee : int
    room_number : int

class DoctorUpdate(BaseModel):
    name : str | None = None
    department_id : int | None = None
    qualification : str | None = None
    experience_years : int | None = None
    date_of_birth : date | None = None
    phone : str | None = None
    email : EmailStr | None = None
    consultation_fee : int | None = None
    room_number : int | None = None
