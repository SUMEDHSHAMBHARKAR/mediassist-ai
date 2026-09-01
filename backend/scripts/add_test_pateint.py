import requests

BASE_URL = "http://127.0.0.1:8000"

patients = [
    {
        "name": "Amit Kumar",
        "date_of_birth": "1998-06-12",
        "mobile_no": "9123456780",
        "address": "Nagpur, Maharashtra",
        "gender": "Male"
    },
    {
        "name": "Neha Singh",
        "date_of_birth": "2001-03-25",
        "mobile_no": "9123456781",
        "address": "Pune, Maharashtra",
        "gender": "Female"
    },
    {
        "name": "Rohan Deshmukh",
        "date_of_birth": "1995-12-08",
        "mobile_no": "9123456782",
        "address": "Nagpur, Maharashtra",
        "gender": "Male"
    },
    {
        "name": "Ananya Joshi",
        "date_of_birth": "2000-08-17",
        "mobile_no": "9123456783",
        "address": "Mumbai, Maharashtra",
        "gender": "Female"
    },
    {
        "name": "Vivek Patil",
        "date_of_birth": "1992-11-30",
        "mobile_no": "9123456784",
        "address": "Nashik, Maharashtra",
        "gender": "Male"
    }
]

for patient in patients:
    response = requests.post(
        f"{BASE_URL}/patient",
        json=patient
    )

    print(
        patient["name"],
        "→",
        response.status_code,
        response.text
    )