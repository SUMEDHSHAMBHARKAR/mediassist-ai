from sqlalchemy import Column,Integer,String,DateTime,ForeignKey,Enum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum

from app.database import Base


class ReportType(str, enum.Enum):
    BLOOD_REPORT = "Blood Report"
    MRI = "MRI"
    CT_SCAN = "CT Scan"
    XRAY = "X-Ray"
    ECG = "ECG"
    PRESCRIPTION = "Prescription"
    OTHER = "Other"


class ReportStatus(str, enum.Enum):
    UPLOADED = "Uploaded"
    VERIFIED = "Verified"
    ARCHIVED = "Archived"


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer,ForeignKey("patients.id"),nullable=False,index=True,)
    report_type = Column(Enum(ReportType),nullable=False,)
    original_filename = Column(String(255),nullable=False,)
    stored_filename = Column(String(255),nullable=False,unique=True,)
    file_path = Column(String(500),nullable=False,)
    content_type = Column(String(100),nullable=False,)
    file_size = Column(Integer,nullable=False,)
    version = Column(Integer,nullable=False,default=1,)
    status = Column(Enum(ReportStatus),nullable=False,default=ReportStatus.UPLOADED,)
    notes = Column(String(1000),nullable=True,)
    uploaded_by = Column(Integer,ForeignKey("users.id"),nullable=False,index=True,)
    uploaded_at = Column(DateTime,default=lambda: datetime.now(timezone.utc),nullable=False,)
    patient = relationship("Patient",back_populates="reports",)
    uploader = relationship("User",back_populates="uploaded_reports",)