from sqlalchemy import (Column, Integer, String, Text, Date, ForeignKey,)
from sqlalchemy.orm import relationship
from app.database import Base


class MedicalRecord(Base):
    __tablename__ = "medical_records"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False, index=True)
    visit_date = Column(Date, nullable=False, index=True)
    chief_complaint = Column(String, nullable=False)
    diagnosis = Column(Text, nullable=False)
    treatment = Column(Text, nullable=True)
    allergies = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    patient = relationship("Patient", back_populates="medical_records", lazy="select")
    doctor = relationship("Doctor", back_populates="medical_records", lazy="select")
    prescriptions = relationship("Prescription", back_populates="medical_record", lazy="select")
