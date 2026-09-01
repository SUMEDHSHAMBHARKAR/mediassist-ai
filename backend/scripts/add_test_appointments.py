import requests

BASE_URL = "http://127.0.0.1:8000"

appointments = [
    {
        "patient_id": 1,
        "doctor_id": 1,
        "appointment_date": "2026-07-20",
        "appointment_time": "10:00:00",
        "reason": "Fever and headache",
        "appointment_type": "OPD"
    },
    {
        "patient_id": 2,
        "doctor_id": 2,
        "appointment_date": "2026-07-21",
        "appointment_time": "11:00:00",
        "reason": "Regular checkup",
        "appointment_type": "OPD"
    },
    {
        "patient_id": 3,
        "doctor_id": 3,
        "appointment_date": "2026-07-22",
        "appointment_time": "12:00:00",
        "reason": "Follow-up consultation",
        "appointment_type": "Follow-up"
    },
    {
        "patient_id": 4,
        "doctor_id": 4,
        "appointment_date": "2026-07-23",
        "appointment_time": "14:00:00",
        "reason": "Back pain",
        "appointment_type": "OPD"
    },
    {
        "patient_id": 5,
        "doctor_id": 5,
        "appointment_date": "2026-07-24",
        "appointment_time": "15:00:00",
        "reason": "Routine consultation",
        "appointment_type": "OPD"
    },
    {
        "patient_id": 1,
        "doctor_id": 1,
        "appointment_date": "2026-07-27",
        "appointment_time": "11:00:00",
        "reason": "Follow-up visit",
        "appointment_type": "Follow-up"
    }
]

for appointment in appointments:
    response = requests.post(
        f"{BASE_URL}/appointment",
        json=appointment
    )

    print(
        response.status_code,
        response.json()
    )