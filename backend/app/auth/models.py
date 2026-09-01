from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Date, Time
from app.database import Base
from sqlalchemy.orm import relationship


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    user_name = Column(String, nullable=False, unique=True, index=True)
    email = Column(String, nullable=False, unique=True, index=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False, index=True)
    is_active = Column(Boolean, nullable=False, default=True)
    patient = relationship("Patient", back_populates="user", uselist=False, lazy="select")
    doctor = relationship("Doctor", back_populates="user", uselist=False, lazy="select")
    notifications = relationship("Notification", back_populates="user", lazy="select")
    uploaded_reports = relationship("Report", back_populates="uploader", lazy="select")
