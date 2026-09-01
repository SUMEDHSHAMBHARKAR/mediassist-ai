from pydantic import BaseModel ,EmailStr 
from datetime import date, time
from enum import Enum

class DepartmentCreate(BaseModel):
    name : str

