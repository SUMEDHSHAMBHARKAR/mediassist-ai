from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.auth import dependencies, models as auth_models
from app.dashboard import crud, schemas, service

router = APIRouter(
    tags=["Dashboard"],
    prefix="/dashboard"
)


# =====================================================
# Role-Based Dashboards (existing)
# =====================================================

@router.get("/doctor", response_model=schemas.DoctorDashboardResponse)
def get_doctor_dashboard(
    db: Session = Depends(get_db),
    doctor: models.Doctor = Depends(dependencies.get_current_doctor),
):
    return crud.get_doctor_dashboard(db, doctor)


@router.get("/patient", response_model=schemas.PatientDashboardResponse)
def get_patient_dashboard(
    db: Session = Depends(get_db),
    patient: models.Patient = Depends(dependencies.get_current_patient),
):
    return crud.get_patient_dashboard(db, patient)


@router.get("/admin", response_model=schemas.AdminDashboardResponse)
def get_admin_dashboard(
    db: Session = Depends(get_db),
    admin: auth_models.User = Depends(dependencies.get_current_admin),
):
    return crud.get_admin_dashboard(db)


# =====================================================
# Hospital Overview
# =====================================================

@router.get("/overview", response_model=schemas.DashboardOverview)
def get_overview(
    db: Session = Depends(get_db),
    current_user: auth_models.User = Depends(dependencies.get_current_user),
):
    return service.get_overview(db)


# =====================================================
# Revenue Analytics
# =====================================================

@router.get("/revenue", response_model=schemas.RevenueAnalytics)
def get_revenue_analytics(
    period: str = Query("monthly", pattern="^(daily|weekly|monthly|yearly)$"),
    db: Session = Depends(get_db),
    current_user: auth_models.User = Depends(dependencies.get_current_user),
):
    return service.get_revenue_analytics(db=db, period=period)


# =====================================================
# Appointment Analytics
# =====================================================

@router.get("/appointments", response_model=schemas.AppointmentAnalytics)
def get_appointment_analytics(
    db: Session = Depends(get_db),
    current_user: auth_models.User = Depends(dependencies.get_current_user),
):
    return service.get_appointment_analytics(db)


# =====================================================
# Doctor Analytics
# =====================================================

@router.get("/doctors", response_model=schemas.DoctorAnalytics)
def get_doctor_analytics(
    db: Session = Depends(get_db),
    current_user: auth_models.User = Depends(dependencies.get_current_user),
):
    return service.get_doctor_analytics(db)


# =====================================================
# Patient Analytics
# =====================================================

@router.get("/patients", response_model=schemas.PatientAnalytics)
def get_patient_analytics(
    db: Session = Depends(get_db),
    current_user: auth_models.User = Depends(dependencies.get_current_user),
):
    return service.get_patient_analytics(db)


# =====================================================
# Report Analytics
# =====================================================

@router.get("/reports", response_model=schemas.ReportAnalytics)
def get_report_analytics(
    db: Session = Depends(get_db),
    current_user: auth_models.User = Depends(dependencies.get_current_user),
):
    return service.get_report_analytics(db)


# =====================================================
# Prescription Analytics
# =====================================================

@router.get("/prescriptions", response_model=schemas.PrescriptionAnalytics)
def get_prescription_analytics(
    db: Session = Depends(get_db),
    current_user: auth_models.User = Depends(dependencies.get_current_user),
):
    return service.get_prescription_analytics(db)


# =====================================================
# Billing Analytics
# =====================================================

@router.get("/billing", response_model=schemas.BillingAnalytics)
def get_billing_analytics(
    db: Session = Depends(get_db),
    current_user: auth_models.User = Depends(dependencies.get_current_user),
):
    return service.get_billing_analytics(db)
