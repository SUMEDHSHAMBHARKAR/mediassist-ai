from pydantic import BaseModel ,EmailStr 
from datetime import date, time
from enum import Enum

class AppointmentCreate(BaseModel):
    doctor_id : int
    appointment_date : date
    appointment_time : time
    reason : str
    appointment_type : str

class AppointmentStatus(str, Enum):
    scheduled = "Scheduled"
    completed = "Completed"
    cancelled = "Cancelled"

class AppointmentStatusUpdate(BaseModel):
    status: AppointmentStatus

class AppointmentReschedule(BaseModel):
    doctor_id : int | None = None
    appointment_date : date | None = None
    appointment_time : time | None = None
