from app.database import SessionLocal
from app import models

db = SessionLocal()

try:
    doctors = db.query(models.Doctor).filter(
        models.Doctor.is_active.is_(None)
    ).all()

    for doctor in doctors:
        doctor.is_active = True

    db.commit()

    print(f"Updated {len(doctors)} doctors to is_active=True")

finally:
    db.close()