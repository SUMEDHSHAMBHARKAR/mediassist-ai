from sqlalchemy.orm import Session
from sqlalchemy import func, extract, cast, String
from datetime import date

from app import models
from app.billing import models as billing_models
from app.prescriptions import models as prescription_models
from app.medical_records import models as medical_record_models
from app.reports import models as report_models
from app.notifications import models as notification_models
from app.appointments import schemas as appointment_schemas


# =====================================================
# Overview Counts
# =====================================================

def get_total_patients(db: Session) -> int:
    return db.query(func.count(models.Patient.id)).scalar()


def get_total_doctors(db: Session) -> int:
    return db.query(func.count(models.Doctor.id)).scalar()


def get_total_appointments(db: Session) -> int:
    return db.query(func.count(models.Appointment.id)).scalar()


def get_today_appointments(db: Session) -> int:
    today = date.today()
    return (
        db.query(func.count(models.Appointment.id))
        .filter(models.Appointment.appointment_date == today)
        .scalar()
    )


def get_pending_bills(db: Session) -> int:
    return (
        db.query(func.count(billing_models.Billing.id))
        .filter(billing_models.Billing.payment_status == billing_models.PaymentStatus.pending)
        .scalar()
    )


def get_paid_bills(db: Session) -> int:
    return (
        db.query(func.count(billing_models.Billing.id))
        .filter(billing_models.Billing.payment_status == billing_models.PaymentStatus.paid)
        .scalar()
    )


def get_total_revenue(db: Session) -> int:
    result = (
        db.query(func.sum(billing_models.Billing.total_amount))
        .filter(billing_models.Billing.payment_status == billing_models.PaymentStatus.paid)
        .scalar()
    )
    return result or 0


def get_unread_notifications(db: Session) -> int:
    return (
        db.query(func.count(notification_models.Notification.id))
        .filter(notification_models.Notification.is_read == False)
        .scalar()
    )


def get_total_medical_records(db: Session) -> int:
    return db.query(func.count(medical_record_models.MedicalRecord.id)).scalar()


def get_total_reports(db: Session) -> int:
    return db.query(func.count(report_models.Report.id)).scalar()


def get_total_prescriptions(db: Session) -> int:
    return db.query(func.count(prescription_models.Prescription.id)).scalar()


# =====================================================
# Revenue Analytics
# =====================================================

def get_revenue_by_period(
    db: Session,
    start_date: date,
    end_date: date,
    period: str,
) -> list[tuple]:

    if period == "daily":
        group_col = billing_models.Billing.paid_at
        label_expr = cast(billing_models.Billing.paid_at, String)
    elif period == "weekly":
        group_col = func.strftime("%Y-W%W", billing_models.Billing.paid_at)
        label_expr = func.strftime("%Y-W%W", billing_models.Billing.paid_at)
    elif period == "monthly":
        group_col = func.strftime("%Y-%m", billing_models.Billing.paid_at)
        label_expr = func.strftime("%Y-%m", billing_models.Billing.paid_at)
    elif period == "yearly":
        group_col = func.strftime("%Y", billing_models.Billing.paid_at)
        label_expr = func.strftime("%Y", billing_models.Billing.paid_at)
    else:
        group_col = billing_models.Billing.paid_at
        label_expr = cast(billing_models.Billing.paid_at, String)

    results = (
        db.query(
            label_expr.label("label"),
            func.sum(billing_models.Billing.total_amount).label("total"),
        )
        .filter(
            billing_models.Billing.payment_status == billing_models.PaymentStatus.paid,
            billing_models.Billing.paid_at >= start_date,
            billing_models.Billing.paid_at <= end_date,
        )
        .group_by(group_col)
        .order_by(group_col)
        .all()
    )

    return results


def get_revenue_in_range(db: Session, start_date: date, end_date: date) -> int:
    result = (
        db.query(func.sum(billing_models.Billing.total_amount))
        .filter(
            billing_models.Billing.payment_status == billing_models.PaymentStatus.paid,
            billing_models.Billing.paid_at >= start_date,
            billing_models.Billing.paid_at <= end_date,
        )
        .scalar()
    )
    return result or 0


# =====================================================
# Appointment Analytics
# =====================================================

def get_appointments_by_status(db: Session) -> dict:
    results = (
        db.query(
            models.Appointment.status,
            func.count(models.Appointment.id),
        )
        .group_by(models.Appointment.status)
        .all()
    )

    status_map = {"Completed": 0, "Cancelled": 0, "Scheduled": 0}
    for status, count in results:
        if status in status_map:
            status_map[status] = count

    return status_map


def get_appointments_per_day(
    db: Session,
    start_date: date,
    end_date: date,
) -> list[tuple]:

    results = (
        db.query(
            cast(models.Appointment.appointment_date, String).label("label"),
            func.count(models.Appointment.id).label("count"),
        )
        .filter(
            models.Appointment.appointment_date >= start_date,
            models.Appointment.appointment_date <= end_date,
        )
        .group_by(models.Appointment.appointment_date)
        .order_by(models.Appointment.appointment_date)
        .all()
    )

    return results


def get_appointments_by_department(db: Session) -> list[tuple]:
    results = (
        db.query(
            models.Department.name.label("department"),
            func.count(models.Appointment.id).label("count"),
        )
        .join(models.Doctor, models.Doctor.id == models.Appointment.doctor_id)
        .join(models.Department, models.Department.id == models.Doctor.department_id)
        .group_by(models.Department.name)
        .order_by(func.count(models.Appointment.id).desc())
        .all()
    )

    return results


# =====================================================
# Doctor Analytics
# =====================================================

def get_active_doctors_count(db: Session) -> int:
    return (
        db.query(func.count(models.Doctor.id))
        .filter(models.Doctor.is_active == True)
        .scalar()
    )


def get_top_doctors(db: Session, limit: int = 10) -> list[tuple]:
    results = (
        db.query(
            models.Doctor.id,
            models.Doctor.name,
            models.Department.name.label("department"),
            func.count(models.Appointment.id).label("total_appointments"),
            func.coalesce(func.sum(billing_models.Billing.total_amount), 0).label("revenue"),
            func.coalesce(func.avg(billing_models.Billing.total_amount), 0).label("avg_consultation"),
        )
        .join(models.Department, models.Department.id == models.Doctor.department_id)
        .outerjoin(models.Appointment, models.Appointment.doctor_id == models.Doctor.id)
        .outerjoin(
            billing_models.Billing,
            (billing_models.Billing.doctor_id == models.Doctor.id)
            & (billing_models.Billing.payment_status == billing_models.PaymentStatus.paid),
        )
        .group_by(models.Doctor.id, models.Doctor.name, models.Department.name)
        .order_by(func.count(models.Appointment.id).desc())
        .limit(limit)
        .all()
    )

    return results


# =====================================================
# Patient Analytics
# =====================================================

def get_gender_distribution(db: Session) -> list[tuple]:
    results = (
        db.query(
            models.Patient.gender,
            func.count(models.Patient.id).label("count"),
        )
        .group_by(models.Patient.gender)
        .all()
    )

    return results


def get_patient_birth_dates(db: Session) -> list:
    results = (
        db.query(models.Patient.date_of_birth)
        .all()
    )
    return [r[0] for r in results]


def get_new_patients_this_month(db: Session) -> int:
    today = date.today()
    first_of_month = today.replace(day=1)
    return (
        db.query(func.count(models.Patient.id))
        .filter(models.Patient.id.in_(
            db.query(models.Patient.id)
            .join(models.Appointment, models.Appointment.patient_id == models.Patient.id)
            .filter(models.Appointment.appointment_date >= first_of_month)
            .group_by(models.Patient.id)
        ))
        .scalar()
    )


def get_most_active_patients(db: Session, limit: int = 10) -> list[tuple]:
    results = (
        db.query(
            models.Patient.id,
            models.Patient.name,
            func.count(models.Appointment.id).label("total_appointments"),
        )
        .join(models.Appointment, models.Appointment.patient_id == models.Patient.id)
        .group_by(models.Patient.id, models.Patient.name)
        .order_by(func.count(models.Appointment.id).desc())
        .limit(limit)
        .all()
    )

    return results


# =====================================================
# Report Analytics
# =====================================================

def get_reports_by_type(db: Session) -> list[tuple]:
    results = (
        db.query(
            report_models.Report.report_type,
            func.count(report_models.Report.id).label("count"),
        )
        .group_by(report_models.Report.report_type)
        .all()
    )

    return results


def get_monthly_report_uploads(db: Session, start_date: date, end_date: date) -> list[tuple]:
    results = (
        db.query(
            func.strftime("%Y-%m", report_models.Report.uploaded_at).label("month"),
            func.count(report_models.Report.id).label("count"),
        )
        .filter(
            report_models.Report.uploaded_at >= start_date,
            report_models.Report.uploaded_at <= end_date,
        )
        .group_by(func.strftime("%Y-%m", report_models.Report.uploaded_at))
        .order_by(func.strftime("%Y-%m", report_models.Report.uploaded_at))
        .all()
    )

    return results


# =====================================================
# Prescription Analytics
# =====================================================

def get_most_prescribed_medicines(db: Session, limit: int = 10) -> list[tuple]:
    results = (
        db.query(
            prescription_models.PrescriptionItem.medicine_name,
            func.count(prescription_models.PrescriptionItem.id).label("count"),
        )
        .group_by(prescription_models.PrescriptionItem.medicine_name)
        .order_by(func.count(prescription_models.PrescriptionItem.id).desc())
        .limit(limit)
        .all()
    )

    return results


def get_prescriptions_per_day(
    db: Session,
    start_date: date,
    end_date: date,
) -> list[tuple]:

    results = (
        db.query(
            cast(prescription_models.Prescription.prescription_date, String).label("label"),
            func.count(prescription_models.Prescription.id).label("count"),
        )
        .filter(
            prescription_models.Prescription.prescription_date >= start_date,
            prescription_models.Prescription.prescription_date <= end_date,
        )
        .group_by(prescription_models.Prescription.prescription_date)
        .order_by(prescription_models.Prescription.prescription_date)
        .all()
    )

    return results


def get_monthly_prescriptions(
    db: Session,
    start_date: date,
    end_date: date,
) -> list[tuple]:

    results = (
        db.query(
            func.strftime("%Y-%m", prescription_models.Prescription.prescription_date).label("month"),
            func.count(prescription_models.Prescription.id).label("count"),
        )
        .filter(
            prescription_models.Prescription.prescription_date >= start_date,
            prescription_models.Prescription.prescription_date <= end_date,
        )
        .group_by(func.strftime("%Y-%m", prescription_models.Prescription.prescription_date))
        .order_by(func.strftime("%Y-%m", prescription_models.Prescription.prescription_date))
        .all()
    )

    return results


# =====================================================
# Billing Analytics
# =====================================================

def get_billing_summary(db: Session) -> dict:
    results = (
        db.query(
            billing_models.Billing.payment_status,
            func.count(billing_models.Billing.id).label("count"),
            func.sum(billing_models.Billing.total_amount).label("total"),
        )
        .group_by(billing_models.Billing.payment_status)
        .all()
    )

    summary = {
        "pending": {"count": 0, "total": 0},
        "paid": {"count": 0, "total": 0},
        "cancelled": {"count": 0, "total": 0},
    }

    for status, count, total in results:
        key = status.value if hasattr(status, "value") else status
        if key in summary:
            summary[key]["count"] = count
            summary[key]["total"] = total or 0

    return summary


def get_billing_average(db: Session) -> float:
    result = (
        db.query(func.avg(billing_models.Billing.total_amount))
        .scalar()
    )
    return round(result, 2) if result else 0.0


def get_monthly_revenue(db: Session, start_date: date, end_date: date) -> list[tuple]:
    results = (
        db.query(
            func.strftime("%Y-%m", billing_models.Billing.paid_at).label("month"),
            func.sum(billing_models.Billing.total_amount).label("total"),
        )
        .filter(
            billing_models.Billing.payment_status == billing_models.PaymentStatus.paid,
            billing_models.Billing.paid_at >= start_date,
            billing_models.Billing.paid_at <= end_date,
        )
        .group_by(func.strftime("%Y-%m", billing_models.Billing.paid_at))
        .order_by(func.strftime("%Y-%m", billing_models.Billing.paid_at))
        .all()
    )

    return results


# =====================================================
# Existing Role-Based Dashboards (preserved)
# =====================================================

def get_doctor_dashboard(db: Session, doctor: models.Doctor):
    from app.dashboard import schemas

    doctor_name = doctor.name
    depertment = db.query(models.Department).filter(models.Department.id == doctor.department_id).first()
    department_name = depertment.name
    today = date.today()
    todays_appointment = db.query(models.Appointment).filter(
        models.Appointment.doctor_id == doctor.id,
        models.Appointment.appointment_date == today
    ).count()
    upcoming_appoinment = db.query(models.Appointment).filter(
        models.Appointment.doctor_id == doctor.id,
        models.Appointment.appointment_date >= today
    ).count()
    completed_today = db.query(models.Appointment).filter(
        models.Appointment.doctor_id == doctor.id,
        models.Appointment.status == appointment_schemas.AppointmentStatus.completed.value,
        models.Appointment.appointment_date == today
    ).count()
    cancelled_today = db.query(models.Appointment).filter(
        models.Appointment.doctor_id == doctor.id,
        models.Appointment.appointment_date == today,
        models.Appointment.status == appointment_schemas.AppointmentStatus.cancelled.value
    ).count()
    pending_today = db.query(models.Appointment).filter(
        models.Appointment.doctor_id == doctor.id,
        models.Appointment.appointment_date == today,
        models.Appointment.status == appointment_schemas.AppointmentStatus.scheduled.value
    ).count()

    return schemas.DoctorDashboardResponse(
        name=doctor_name,
        department=department_name,
        today_appointments=todays_appointment,
        upcoming_appointments=upcoming_appoinment,
        completed_today=completed_today,
        cancelled_today=cancelled_today,
        pending_today=pending_today
    )


def get_patient_dashboard(db: Session, patient: models.Patient):
    from app.dashboard import schemas

    patient_name = patient.name
    today = date.today()
    next_appointment = db.query(models.Appointment).filter(
        models.Appointment.patient_id == patient.id,
        models.Appointment.status == appointment_schemas.AppointmentStatus.scheduled.value,
        models.Appointment.appointment_date >= today
    ).order_by(models.Appointment.appointment_date.asc(), models.Appointment.appointment_time.asc()).first()

    if next_appointment is None:
        next_appoinment_date = None
        next_appoinment_time = None
        doctor_name = None
    else:
        next_appoinment_date = next_appointment.appointment_date
        next_appoinment_time = next_appointment.appointment_time
        doctor = db.query(models.Doctor).filter(models.Doctor.id == next_appointment.doctor_id).first()
        doctor_name = doctor.name

    total_appointment = db.query(models.Appointment).filter(
        models.Appointment.patient_id == patient.id
    ).count()

    completed = db.query(models.Appointment).filter(
        models.Appointment.patient_id == patient.id,
        models.Appointment.status == appointment_schemas.AppointmentStatus.completed.value
    ).count()
    cancelled = db.query(models.Appointment).filter(
        models.Appointment.patient_id == patient.id,
        models.Appointment.status == appointment_schemas.AppointmentStatus.cancelled.value
    ).count()

    return schemas.PatientDashboardResponse(
        name=patient_name,
        next_appointment_date=next_appoinment_date,
        next_appointment_time=next_appoinment_time,
        doctor_name=doctor_name,
        total_appointments=total_appointment,
        completed_appointments=completed,
        cancelled_appointments=cancelled
    )


def get_admin_dashboard(db: Session):
    from app.dashboard import schemas

    total_doctors = db.query(models.Doctor).count()
    total_doctors_active = db.query(models.Doctor).filter(models.Doctor.is_active == True).count()
    total_doctors_inactive = db.query(models.Doctor).filter(models.Doctor.is_active == False).count()
    total_patients = db.query(models.Patient).count()
    today = date.today()
    today_appointment = db.query(models.Appointment).filter(models.Appointment.appointment_date == today).count()
    completed_today = db.query(models.Appointment).filter(
        models.Appointment.appointment_date == today,
        models.Appointment.status == appointment_schemas.AppointmentStatus.completed.value
    ).count()
    cancelled_today = db.query(models.Appointment).filter(
        models.Appointment.appointment_date == today,
        models.Appointment.status == appointment_schemas.AppointmentStatus.cancelled.value
    ).count()
    scheduled_today = db.query(models.Appointment).filter(
        models.Appointment.appointment_date == today,
        models.Appointment.status == appointment_schemas.AppointmentStatus.scheduled.value
    ).count()
    total_department = db.query(models.Department).count()

    return schemas.AdminDashboardResponse(
        total_doctors=total_doctors,
        active_doctors=total_doctors_active,
        inactive_doctors=total_doctors_inactive,
        total_patients=total_patients,
        today_appointments=today_appointment,
        completed_today=completed_today,
        cancelled_today=cancelled_today,
        scheduled_today=scheduled_today,
        total_departments=total_department
    )
