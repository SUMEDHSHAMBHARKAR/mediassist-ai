from sqlalchemy import Column, Integer, String, Text, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import date


class Prescription(Base):
    __tablename__ = "prescriptions"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False, index=True)
    medical_record_id = Column(Integer, ForeignKey("medical_records.id"), nullable=False, index=True)
    prescription_date = Column(Date, nullable=False, default=date.today, index=True)
    diagnosis = Column(Text, nullable=False)
    instructions = Column(Text, nullable=True)
    follow_up_date = Column(Date, nullable=True)
    status = Column(String, nullable=False, default="active", index=True)
    created_at = Column(Date, nullable=False, default=date.today, index=True)
    patient = relationship("Patient", back_populates="prescriptions", lazy="select")
    doctor = relationship("Doctor", back_populates="prescriptions", lazy="select")
    medical_record = relationship("MedicalRecord", back_populates="prescriptions", lazy="select")
    prescription_items = relationship(
        "PrescriptionItem",
        back_populates="prescription",
        cascade="all, delete-orphan",
        lazy="select",
    )


class PrescriptionItem(Base):
    __tablename__ = "prescription_items"
    id = Column(Integer, primary_key=True, index=True)
    prescription_id = Column(Integer, ForeignKey("prescriptions.id"), nullable=False, index=True)
    medicine_name = Column(String, nullable=False, index=True)
    dosage = Column(String, nullable=False)
    frequency = Column(String, nullable=False)
    duration = Column(String, nullable=False)
    route = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    prescription = relationship("Prescription", back_populates="prescription_items", lazy="select")
