from pydantic import BaseModel ,EmailStr 
from datetime import date


class PatientCreate(BaseModel):
    name : str
    date_of_birth : date
    mobile_no : str
    address : str
    gender : str

class PatientUpdate(BaseModel):
    name : str | None = None
    date_of_birth : date | None = None
    mobile_no : str | None = None
    address : str | None = None
    gender : str | None = None

class PatientProfileCreate(BaseModel):
    name : str
    date_of_birth : date
    mobile_no : str
    address : str
    gender : str

class PatientProfileUpdate(BaseModel):
    name : str | None = None
    date_of_birth : date | None = None
    mobile_no : str | None = None
    address : str | None = None
    gender : str | None = None
