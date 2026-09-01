"""Create predictable, idempotent demo accounts and hospital records.

Run from the backend directory:
    python scripts/seed_demo_data.py
"""

from datetime import date, time
from pathlib import Path
import sys

# Support `python scripts/seed_demo_data.py` from the backend directory.
BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app import models
from app.auth import crud as auth_crud
from app.auth import models as auth_models
from app.auth import schemas as auth_schemas
from app.database import SessionLocal

# Importing the application registers every SQLAlchemy model referenced by the
# User relationships (notifications, reports, prescriptions, and so on).
from app.main import app as _application  # noqa: F401


PASSWORD = "DemoPass@2026"

ADMINS = (
    ("demo_admin_1", "admin1@mediassistdemo.org"),
    ("demo_admin_2", "admin2@mediassistdemo.org"),
)

DOCTORS = (
    {
        "user_name": "demo_doctor_1",
        "email": "doctor1@mediassistdemo.org",
        "name": "Dr. Ananya Rao",
        "department": "Cardiology",
        "qualification": "MD Cardiology",
        "experience_years": 12,
        "date_of_birth": date(1982, 5, 14),
        "phone": "9000000101",
        "consultation_fee": 900,
        "room_number": 201,
    },
    {
        "user_name": "demo_doctor_2",
        "email": "doctor2@mediassistdemo.org",
        "name": "Dr. Vikram Shah",
        "department": "General Medicine",
        "qualification": "MD Medicine",
        "experience_years": 9,
        "date_of_birth": date(1987, 9, 22),
        "phone": "9000000102",
        "consultation_fee": 700,
        "room_number": 105,
    },
)

PATIENTS = (
    {
        "user_name": "demo_patient_1",
        "email": "patient1@mediassistdemo.org",
        "name": "Riya Mehta",
        "date_of_birth": date(1994, 3, 11),
        "mobile_no": "9000000201",
        "address": "Pune, Maharashtra",
        "gender": "Female",
    },
    {
        "user_name": "demo_patient_2",
        "email": "patient2@mediassistdemo.org",
        "name": "Arjun Kapoor",
        "date_of_birth": date(1989, 11, 2),
        "mobile_no": "9000000202",
        "address": "Mumbai, Maharashtra",
        "gender": "Male",
    },
)


def get_or_create_user(db, user_name, email, role):
    user = db.query(auth_models.User).filter(auth_models.User.email == email).first()
    if user:
        return user
    return auth_crud.create_user_with_role(
        db=db,
        user_name=user_name,
        email=email,
        password=PASSWORD,
        role=role,
    )


def get_or_create_department(db, name):
    department = db.query(models.Department).filter(models.Department.name == name).first()
    if department:
        return department
    department = models.Department(name=name)
    db.add(department)
    db.flush()
    return department


def seed():
    db = SessionLocal()
    try:
        # Upgrade addresses produced by the first version of this seed script.
        # `.local` is rejected by the API's email response validation.
        for email in [email for _, email in ADMINS] + [item["email"] for item in DOCTORS] + [item["email"] for item in PATIENTS]:
            legacy_email = email.replace("@mediassistdemo.org", "@mediassist.local")
            legacy_user = db.query(auth_models.User).filter(auth_models.User.email == legacy_email).first()
            if legacy_user:
                legacy_user.email = email
        db.flush()

        for user_name, email in ADMINS:
            get_or_create_user(db, user_name, email, auth_schemas.UserRole.admin)

        doctor_profiles = []
        for values in DOCTORS:
            user = get_or_create_user(
                db, values["user_name"], values["email"], auth_schemas.UserRole.doctor
            )
            profile = db.query(models.Doctor).filter(models.Doctor.user_id == user.id).first()
            if not profile:
                department = get_or_create_department(db, values["department"])
                profile = models.Doctor(
                    user_id=user.id,
                    name=values["name"],
                    department_id=department.id,
                    qualification=values["qualification"],
                    experience_years=values["experience_years"],
                    date_of_birth=values["date_of_birth"],
                    phone=values["phone"],
                    email=values["email"],
                    consultation_fee=values["consultation_fee"],
                    room_number=values["room_number"],
                )
                db.add(profile)
                db.flush()
            elif profile.email != values["email"]:
                profile.email = values["email"]
            doctor_profiles.append(profile)

        patient_profiles = []
        for values in PATIENTS:
            user = get_or_create_user(
                db, values["user_name"], values["email"], auth_schemas.UserRole.patient
            )
            profile = db.query(models.Patient).filter(models.Patient.user_id == user.id).first()
            if not profile:
                profile = models.Patient(user_id=user.id, **{
                    key: values[key]
                    for key in ("name", "date_of_birth", "mobile_no", "address", "gender")
                })
                db.add(profile)
                db.flush()
            patient_profiles.append(profile)

        appointments = (
            (patient_profiles[0], doctor_profiles[0], date(2026, 9, 2), time(10, 0), "Cardiac wellness review"),
            (patient_profiles[0], doctor_profiles[1], date(2026, 9, 5), time(11, 30), "Seasonal allergy follow-up"),
            (patient_profiles[1], doctor_profiles[1], date(2026, 9, 3), time(14, 0), "Annual health check"),
            (patient_profiles[1], doctor_profiles[0], date(2026, 9, 9), time(9, 30), "Blood pressure consultation"),
        )
        for patient, doctor, appointment_date, appointment_time, reason in appointments:
            exists = db.query(models.Appointment).filter(
                models.Appointment.patient_id == patient.id,
                models.Appointment.doctor_id == doctor.id,
                models.Appointment.appointment_date == appointment_date,
                models.Appointment.appointment_time == appointment_time,
            ).first()
            if not exists:
                db.add(models.Appointment(
                    patient_id=patient.id,
                    doctor_id=doctor.id,
                    appointment_date=appointment_date,
                    appointment_time=appointment_time,
                    reason=reason,
                    appointment_type="Consultation",
                    status="Scheduled",
                ))

        db.commit()
        print("Demo data is ready. All demo accounts use password:", PASSWORD)
        for user_name, email in ADMINS:
            print(f"Admin:   {user_name} / {email}")
        for values in DOCTORS:
            print(f"Doctor:  {values['user_name']} / {values['email']}")
        for values in PATIENTS:
            print(f"Patient: {values['user_name']} / {values['email']}")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
