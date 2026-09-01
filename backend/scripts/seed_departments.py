import json

from app import models
from app.database import SessionLocal


def seed_departments():

    db = SessionLocal()

    with open("data/departments.json", "r") as file:
        departments = json.load(file)

    for department_name in departments:

        existing_department = db.query(models.Department).filter(
            models.Department.name == department_name
        ).first()

        if existing_department is None:

            new_department = models.Department(
                name=department_name
            )

            db.add(new_department)

    db.commit()
    db.close()


seed_departments()


