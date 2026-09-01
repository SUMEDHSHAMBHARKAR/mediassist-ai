from sqlalchemy.orm import Session
from datetime import date, timedelta

from app.dashboard import crud, schemas, analytics


# =====================================================
# Dashboard Overview
# =====================================================

def get_overview(db: Session) -> schemas.DashboardOverview:
    return schemas.DashboardOverview(
        total_patients=crud.get_total_patients(db),
        total_doctors=crud.get_total_doctors(db),
        total_appointments=crud.get_total_appointments(db),
        today_appointments=crud.get_today_appointments(db),
        pending_bills=crud.get_pending_bills(db),
        paid_bills=crud.get_paid_bills(db),
        revenue=crud.get_total_revenue(db),
        unread_notifications=crud.get_unread_notifications(db),
        medical_records=crud.get_total_medical_records(db),
        reports_uploaded=crud.get_total_reports(db),
        prescriptions_created=crud.get_total_prescriptions(db),
    )


# =====================================================
# Revenue Analytics
# =====================================================

def get_revenue_analytics(
    db: Session,
    period: str = "monthly",
) -> schemas.RevenueAnalytics:

    start_date, end_date = analytics.get_date_range(period)

    results = crud.get_revenue_by_period(
        db=db,
        start_date=start_date,
        end_date=end_date,
        period=period,
    )

    labels = [r[0] for r in results] if results else []
    values = [r[1] for r in results] if results else []

    total_revenue = sum(values)
    average_revenue = analytics.calculate_average(total_revenue, len(values)) if values else 0.0

    current_start, current_end = analytics.get_current_month_range()
    previous_start, previous_end = analytics.get_previous_month_range()

    current_revenue = crud.get_revenue_in_range(db, current_start, current_end)
    previous_revenue = crud.get_revenue_in_range(db, previous_start, previous_end)
    growth = analytics.calculate_growth(current_revenue, previous_revenue)

    return schemas.RevenueAnalytics(
        total_revenue=total_revenue,
        period=period,
        chart=schemas.ChartData(labels=labels, values=values),
        average_revenue=average_revenue,
        growth_percentage=growth,
    )


# =====================================================
# Appointment Analytics
# =====================================================

def get_appointment_analytics(db: Session) -> schemas.AppointmentAnalytics:

    total = crud.get_total_appointments(db)
    status_map = crud.get_appointments_by_status(db)

    today = date.today()
    start_date = today - timedelta(days=30)
    per_day_results = crud.get_appointments_per_day(db, start_date, today)
    per_day_labels = [r[0] for r in per_day_results]
    per_day_values = [r[1] for r in per_day_results]

    dept_results = crud.get_appointments_by_department(db)
    total_dept = sum(r[1] for r in dept_results)
    dept_data = [
        schemas.PieChartData(
            label=r[0],
            value=r[1],
            percentage=analytics.calculate_percentage(r[1], total_dept),
        )
        for r in dept_results
    ]

    return schemas.AppointmentAnalytics(
        total_appointments=total,
        status_breakdown=schemas.AppointmentsByStatus(
            completed=status_map["Completed"],
            cancelled=status_map["Cancelled"],
            scheduled=status_map["Scheduled"],
        ),
        appointments_per_day=schemas.ChartData(
            labels=per_day_labels,
            values=per_day_values,
        ),
        appointments_by_department=dept_data,
    )


# =====================================================
# Doctor Analytics
# =====================================================

def get_doctor_analytics(db: Session) -> schemas.DoctorAnalytics:

    total = crud.get_total_doctors(db)
    active = crud.get_active_doctors_count(db)

    top_results = crud.get_top_doctors(db, limit=10)

    top_doctors = [
        schemas.TopDoctor(
            doctor_id=r[0],
            name=r[1],
            department=r[2],
            total_appointments=r[3],
            revenue_generated=r[4],
            average_consultation=round(float(r[5]), 2),
        )
        for r in top_results
    ]

    return schemas.DoctorAnalytics(
        total_doctors=total,
        active_doctors=active,
        top_doctors=top_doctors,
    )


# =====================================================
# Patient Analytics
# =====================================================

def get_patient_analytics(db: Session) -> schemas.PatientAnalytics:

    total = crud.get_total_patients(db)
    new_this_month = crud.get_new_patients_this_month(db)

    gender_results = crud.get_gender_distribution(db)
    total_gender = sum(r[1] for r in gender_results)
    gender_data = [
        schemas.PieChartData(
            label=r[0] or "Unknown",
            value=r[1],
            percentage=analytics.calculate_percentage(r[1], total_gender),
        )
        for r in gender_results
    ]

    birth_dates = crud.get_patient_birth_dates(db)
    age_group_counts = {}
    for bd in birth_dates:
        if bd:
            group = analytics.get_age_group(bd)
            age_group_counts[group] = age_group_counts.get(group, 0) + 1

    total_aged = sum(age_group_counts.values())
    age_groups = [
        schemas.AgeGroup(
            group=g,
            count=age_group_counts.get(g, 0),
            percentage=analytics.calculate_percentage(age_group_counts.get(g, 0), total_aged),
        )
        for g in analytics.AGE_GROUP_ORDER
    ]

    active_results = crud.get_most_active_patients(db, limit=10)
    most_active = [
        {
            "patient_id": r[0],
            "name": r[1],
            "total_appointments": r[2],
        }
        for r in active_results
    ]

    return schemas.PatientAnalytics(
        total_patients=total,
        new_patients_this_month=new_this_month,
        gender_distribution=gender_data,
        age_groups=age_groups,
        most_active_patients=most_active,
    )


# =====================================================
# Report Analytics
# =====================================================

def get_report_analytics(db: Session) -> schemas.ReportAnalytics:

    total = crud.get_total_reports(db)

    type_results = crud.get_reports_by_type(db)
    total_types = sum(r[1] for r in type_results)
    report_types = [
        schemas.PieChartData(
            label=r[0].value if hasattr(r[0], "value") else str(r[0]),
            value=r[1],
            percentage=analytics.calculate_percentage(r[1], total_types),
        )
        for r in type_results
    ]

    start_date, end_date = analytics.get_date_range("monthly")
    monthly_results = crud.get_monthly_report_uploads(db, start_date, end_date)
    monthly_labels = [r[0] for r in monthly_results]
    monthly_values = [r[1] for r in monthly_results]

    return schemas.ReportAnalytics(
        total_reports=total,
        report_types=report_types,
        monthly_uploads=schemas.ChartData(
            labels=monthly_labels,
            values=monthly_values,
        ),
    )


# =====================================================
# Prescription Analytics
# =====================================================

def get_prescription_analytics(db: Session) -> schemas.PrescriptionAnalytics:

    total = crud.get_total_prescriptions(db)

    medicines = crud.get_most_prescribed_medicines(db, limit=10)
    medicine_list = [
        schemas.MedicineFrequency(
            medicine_name=r[0],
            count=r[1],
        )
        for r in medicines
    ]

    today = date.today()
    start_date = today - timedelta(days=30)
    per_day_results = crud.get_prescriptions_per_day(db, start_date, today)
    total_days = len(per_day_results) if per_day_results else 1
    total_in_range = sum(r[1] for r in per_day_results)
    avg_per_day = analytics.calculate_average(total_in_range, total_days)

    monthly_start, monthly_end = analytics.get_date_range("monthly")
    monthly_results = crud.get_monthly_prescriptions(db, monthly_start, monthly_end)
    monthly_labels = [r[0] for r in monthly_results]
    monthly_values = [r[1] for r in monthly_results]

    return schemas.PrescriptionAnalytics(
        total_prescriptions=total,
        most_prescribed_medicines=medicine_list,
        average_prescriptions_per_day=avg_per_day,
        monthly_prescriptions=schemas.ChartData(
            labels=monthly_labels,
            values=monthly_values,
        ),
    )


# =====================================================
# Billing Analytics
# =====================================================

def get_billing_analytics(db: Session) -> schemas.BillingAnalytics:

    summary = crud.get_billing_summary(db)
    avg_amount = crud.get_billing_average(db)

    total_bills = (
        summary["pending"]["count"]
        + summary["paid"]["count"]
        + summary["cancelled"]["count"]
    )
    total_revenue = summary["paid"]["total"]
    outstanding = summary["pending"]["total"]

    start_date, end_date = analytics.get_date_range("monthly")
    monthly_results = crud.get_monthly_revenue(db, start_date, end_date)
    labels = [r[0] for r in monthly_results]
    values = [r[1] for r in monthly_results]

    return schemas.BillingAnalytics(
        total_bills=total_bills,
        pending_bills=summary["pending"]["count"],
        paid_bills=summary["paid"]["count"],
        cancelled_bills=summary["cancelled"]["count"],
        total_revenue=total_revenue,
        outstanding_payments=outstanding,
        average_bill_amount=avg_amount,
        revenue_chart=schemas.ChartData(labels=labels, values=values),
    )
