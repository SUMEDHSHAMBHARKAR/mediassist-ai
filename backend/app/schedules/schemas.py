from pydantic import BaseModel ,EmailStr 
from datetime import date, time
from enum import Enum

class DayOfWeek(str , Enum):
    MONDAY = "Monday"
    TUESDAY = "Tuesday"
    WEDNESDAY = "Wednesday"
    THURSDAY = "Thursday"
    FRIDAY = "Friday"
    SATURDAY = "Saturday"
    SUNDAY = "Sunday"

class DoctorScheduleCreate(BaseModel):
    doctor_id : int | None = None
    day_of_week : DayOfWeek
    start_time : time
    end_time : time
   
class DoctorScheduleResponce(DoctorScheduleCreate):
    id : int
    doctor_id : int

    model_config = {
        "from_attributes" : True
    }

class DoctorScheduleUpdate(BaseModel):
    day_of_week : DayOfWeek
    start_time : time
    end_time : time
   