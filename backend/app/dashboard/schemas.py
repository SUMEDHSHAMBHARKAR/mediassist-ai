from pydantic import BaseModel
from datetime import date, time


# =====================================================
# Reusable Analytics Schemas
# =====================================================

class MetricCard(BaseModel):
    label: str
    value: int | float
    change_percentage: float | None = None


class ChartData(BaseModel):
    labels: list[str]
    values: list[int | float]


class PieChartData(BaseModel):
    label: str
    value: int | float
    percentage: float


class TimeSeries(BaseModel):
    labels: list[str]
    values: list[int | float]
    period: str


# =====================================================
# Dashboard Overview
# =====================================================

class DashboardOverview(BaseModel):
    total_patients: int
    total_doctors: int
    total_appointments: int
    today_appointments: int
    pending_bills: int
    paid_bills: int
    revenue: int
    unread_notifications: int
    medical_records: int
    reports_uploaded: int
    prescriptions_created: int


# =====================================================
# Revenue Analytics
# =====================================================

class RevenueAnalytics(BaseModel):
    total_revenue: int
    period: str
    chart: ChartData
    average_revenue: float
    growth_percentage: float | None = None


# =====================================================
# Appointment Analytics
# =====================================================

class AppointmentsByStatus(BaseModel):
    completed: int
    cancelled: int
    scheduled: int


class AppointmentAnalytics(BaseModel):
    total_appointments: int
    status_breakdown: AppointmentsByStatus
    appointments_per_day: ChartData
    appointments_by_department: list[PieChartData]


# =====================================================
# Doctor Analytics
# =====================================================

class TopDoctor(BaseModel):
    doctor_id: int
    name: str
    department: str
    total_appointments: int
    revenue_generated: int
    average_consultation: float


class DoctorAnalytics(BaseModel):
    total_doctors: int
    active_doctors: int
    top_doctors: list[TopDoctor]


# =====================================================
# Patient Analytics
# =====================================================

class AgeGroup(BaseModel):
    group: str
    count: int
    percentage: float


class PatientAnalytics(BaseModel):
    total_patients: int
    new_patients_this_month: int
    gender_distribution: list[PieChartData]
    age_groups: list[AgeGroup]
    most_active_patients: list[dict]


# =====================================================
# Report Analytics
# =====================================================

class ReportAnalytics(BaseModel):
    total_reports: int
    report_types: list[PieChartData]
    monthly_uploads: ChartData


# =====================================================
# Prescription Analytics
# =====================================================

class MedicineFrequency(BaseModel):
    medicine_name: str
    count: int


class PrescriptionAnalytics(BaseModel):
    total_prescriptions: int
    most_prescribed_medicines: list[MedicineFrequency]
    average_prescriptions_per_day: float
    monthly_prescriptions: ChartData


# =====================================================
# Billing Analytics
# =====================================================

class BillingAnalytics(BaseModel):
    total_bills: int
    pending_bills: int
    paid_bills: int
    cancelled_bills: int
    total_revenue: int
    outstanding_payments: int
    average_bill_amount: float
    revenue_chart: ChartData


# =====================================================
# Existing Role-Based Dashboards (preserved)
# =====================================================

class DoctorDashboardResponse(BaseModel):
    name: str
    department: str
    today_appointments: int
    upcoming_appointments: int
    completed_today: int
    cancelled_today: int
    pending_today: int


class PatientDashboardResponse(BaseModel):
    name: str
    next_appointment_date: date | None
    next_appointment_time: time | None
    doctor_name: str | None
    total_appointments: int
    completed_appointments: int
    cancelled_appointments: int


class AdminDashboardResponse(BaseModel):
    total_doctors: int
    active_doctors: int
    inactive_doctors: int
    total_patients: int
    today_appointments: int
    completed_today: int
    cancelled_today: int
    scheduled_today: int
    total_departments: int
