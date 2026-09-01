from sqlalchemy import Column , Integer , String , Boolean , ForeignKey , Date , Time 
from app.database import Base
from sqlalchemy.orm import relationship
from app.auth import models as auth_models

class Patient(Base):
    __tablename__ = "patients"
    id = Column(Integer , primary_key=True)
    name = Column(String , nullable=False, index=True)
    date_of_birth = Column(Date,nullable=False)
    mobile_no = Column(String, index=True)
    address = Column(String)
    gender = Column(String,nullable=False, index=True)
    user_id = Column(Integer , ForeignKey(auth_models.User.id) ,  unique= True, nullable=False, index=True)
    user = relationship("User" , back_populates="patient", lazy="select")
    medical_records = relationship("MedicalRecord",back_populates="patient", cascade="all, delete-orphan", lazy="select")
    prescriptions = relationship("Prescription", back_populates="patient", lazy="select")
    billings = relationship("Billing",back_populates="patient", lazy="select")
    reports = relationship("Report",back_populates="patient", lazy="select")


class Doctor(Base):
    __tablename__ = "doctors"
    id = Column(Integer , primary_key=True)
    name = Column(String , nullable=False, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False, index=True)
    qualification = Column(String, nullable=False)
    experience_years = Column(Integer, nullable=False)
    phone = Column(String, nullable=False)
    date_of_birth = Column(Date ,nullable=False)
    email = Column(String, index=True)
    consultation_fee = Column(Integer)
    room_number = Column(Integer)
    is_available = Column(Boolean , default=True)
    schedules = relationship("DoctorSchedule" , back_populates = "doctor", lazy="select")
    is_active = Column(Boolean , default= True, index=True)
    user_id = Column(Integer , ForeignKey(auth_models.User.id) ,  unique= True, nullable=False, index=True)
    user = relationship("User" , back_populates="doctor", lazy="select")
    medical_records = relationship("MedicalRecord",back_populates="doctor", lazy="select")
    prescriptions = relationship("Prescription", back_populates="doctor", lazy="select")
    billings = relationship("Billing",back_populates="doctor", lazy="select")
    
class Department(Base):
    __tablename__ = "departments"
    id = Column(Integer , primary_key= True)
    name = Column(String , nullable=False ,unique=True)

class Appointment(Base):
    __tablename__ = "appointments"
    id = Column(Integer , primary_key= True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False, index=True)
    appointment_date = Column(Date, nullable=False, index=True)
    appointment_time = Column(Time, nullable=False)
    reason = Column(String , nullable=False)
    appointment_type = Column(String, nullable=False)
    status = Column(String , default= "Scheduled", nullable=False, index=True)
    billings = relationship("Billing",back_populates = "appointment" , uselist=False, lazy="select")
    

class DoctorSchedule(Base):
    __tablename__ = "doctor_schedule"
    id = Column(Integer , primary_key= True)
    doctor_id = Column(Integer , ForeignKey("doctors.id") , nullable= False, index=True)
    day_of_week = Column(String , nullable=False)
    start_time = Column(Time , nullable=False)
    end_time = Column(Time , nullable=False)
    doctor = relationship("Doctor" , back_populates= "schedules", lazy="select")

    