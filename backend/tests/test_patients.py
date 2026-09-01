import pytest
from datetime import date
from tests.conftest import auth_header
from app import models
from app.auth import models as auth_models


class TestGetPatients:
    def test_get_patients_paginated(self, client, db, admin_user, admin_token):
        # Create test patients
        for i in range(5):
            user = auth_models.User(
                user_name=f"patuser{i}",
                email=f"pat{i}@test.com",
                hashed_password="hashed",
                role="Patient",
                is_active=True,
            )
            db.add(user)
            db.flush()
            patient = models.Patient(
                name=f"Patient {i}",
                date_of_birth=date(1990, 1, 1),
                mobile_no=f"900000000{i}",
                address="Test City",
                gender="Male",
                user_id=user.id,
            )
            db.add(patient)
        db.commit()

        response = client.get(
            "/patients?page=1&page_size=3",
            headers=auth_header(admin_token),
        )
        assert response.status_code == 200
        data = response.json()
        assert data["page"] == 1
        assert data["page_size"] == 3
        assert len(data["items"]) == 3
        assert data["total_records"] == 5

    def test_get_patients_search(self, client, db, admin_user, admin_token):
        user = auth_models.User(
            user_name="searchpat",
            email="searchpat@test.com",
            hashed_password="hashed",
            role="Patient",
            is_active=True,
        )
        db.add(user)
        db.flush()
        patient = models.Patient(
            name="Unique Rahul Name",
            date_of_birth=date(1990, 1, 1),
            mobile_no="9876543210",
            address="Mumbai",
            gender="Male",
            user_id=user.id,
        )
        db.add(patient)
        db.commit()

        response = client.get(
            "/patients?search=Rahul",
            headers=auth_header(admin_token),
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total_records"] >= 1

    def test_get_patients_filter_gender(self, client, db, admin_user, admin_token):
        for i, gender in enumerate(["Male", "Female", "Male"]):
            user = auth_models.User(
                user_name=f"genpat{i}",
                email=f"genpat{i}@test.com",
                hashed_password="hashed",
                role="Patient",
                is_active=True,
            )
            db.add(user)
            db.flush()
            patient = models.Patient(
                name=f"Patient G{i}",
                date_of_birth=date(1990, 1, 1),
                mobile_no=f"800000000{i}",
                address="Test",
                gender=gender,
                user_id=user.id,
            )
            db.add(patient)
        db.commit()

        response = client.get(
            "/patients?gender=Female",
            headers=auth_header(admin_token),
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total_records"] == 1


class TestGetPatientById:
    def test_get_patient_found(self, client, db, admin_token):
        user = auth_models.User(
            user_name="getpat",
            email="getpat@test.com",
            hashed_password="hashed",
            role="Patient",
            is_active=True,
        )
        db.add(user)
        db.flush()
        patient = models.Patient(
            name="Get Patient",
            date_of_birth=date(1990, 5, 15),
            mobile_no="1234567890",
            address="Delhi",
            gender="Male",
            user_id=user.id,
        )
        db.add(patient)
        db.commit()
        db.refresh(patient)

        response = client.get(f"/patients/{patient.id}")
        assert response.status_code == 200

    def test_get_patient_not_found(self, client):
        response = client.get("/patients/99999")
        assert response.status_code == 404
