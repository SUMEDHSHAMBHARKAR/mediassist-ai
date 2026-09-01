from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Date
from app.database import Base
from sqlalchemy.orm import relationship
from datetime import date
import enum
from sqlalchemy import Enum


class PaymentStatus(str, enum.Enum):
    pending = "pending"
    paid = "paid"
    cancelled = "cancelled"


class Billing(Base):
    __tablename__ = "billings"
    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), unique=True, nullable=False)
    consultation_fee = Column(Integer, nullable=False)
    medicine_charge = Column(Integer, nullable=False)
    test_charge = Column(Integer, nullable=False)
    other_charge = Column(Integer, nullable=False)
    total_amount = Column(Integer, nullable=False)
    payment_status = Column(Enum(PaymentStatus), default=PaymentStatus.pending, nullable=True, index=True)
    payment_method = Column(String, nullable=False)
    created_at = Column(Date, nullable=False, default=date.today, index=True)
    paid_at = Column(Date, nullable=False, index=True)
    patient = relationship("Patient", back_populates="billings", lazy="select")
    doctor = relationship("Doctor", back_populates="billings", lazy="select")
    appointment = relationship("Appointment", back_populates="billings", lazy="select")
