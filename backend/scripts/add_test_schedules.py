import requests

BASE_URL = "http://127.0.0.1:8000"

schedules = [
    # Doctor 1 — Monday
    {
        "doctor_id": 1,
        "day_of_week": "Monday",
        "start_time": "09:00:00",
        "end_time": "17:00:00"
    },

    # Doctor 2 — Tuesday
    {
        "doctor_id": 2,
        "day_of_week": "Tuesday",
        "start_time": "09:00:00",
        "end_time": "17:00:00"
    },

    # Doctor 3 — Wednesday
    {
        "doctor_id": 3,
        "day_of_week": "Wednesday",
        "start_time": "09:00:00",
        "end_time": "17:00:00"
    },

    # Doctor 4 — Thursday
    {
        "doctor_id": 4,
        "day_of_week": "Thursday",
        "start_time": "09:00:00",
        "end_time": "17:00:00"
    },

    # Doctor 5 — Friday
    {
        "doctor_id": 5,
        "day_of_week": "Friday",
        "start_time": "09:00:00",
        "end_time": "17:00:00"
    }
]

for schedule in schedules:
    response = requests.post(
        f"{BASE_URL}/doctor-schedules",
        json=schedule
    )

    print(
        response.status_code,
        response.json()
    )

    