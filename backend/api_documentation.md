# MediAssist AI Backend - API Endpoint & JSON Response Documentation

This document contains full details and **exact empirical JSON responses** captured by running test execution against all endpoints in the **MediAssist AI** FastAPI backend.

---

## Table of Contents

1. [System & Health (`/`)](#1-system--health)
2. [Authentication (`/auth`)](#2-authentication-auth)
3. [Doctors (`/doctors`)](#3-doctors)
4. [Patients (`/patients`, `/patient`)](#4-patients)
5. [Appointments (`/appointments`, `/appointment`, `/doctor`, `/patient`)](#5-appointments)
6. [Doctor Schedules (`/schedules`, `/doctor-schedules`, `/doctors`)](#6-doctor-schedules)
7. [Dashboard & Analytics (`/dashboard`)](#7-dashboard--analytics-dashboard)
8. [Medical Records (`/medical-records`)](#8-medical-records-medical-records)
9. [Prescriptions (`/prescriptions`)](#9-prescriptions-prescriptions)
10. [Billing (`/billing`)](#10-billing-billing)
11. [Notifications (`/notifications`)](#11-notifications-notifications)
12. [Reports & Files (`/reports`)](#12-reports--files-reports)
13. [Audit Trail (`/audit`)](#13-audit-trail-audit)
14. [AI Features (`/ai`)](#14-ai-features-ai)

---

## 1. System & Health

### `GET /`
- **Description**: Welcome route
- **Status Code**: `200 OK`
- **JSON Response**:
```json
{
  "message": "Welcome to MediAssist AI"
}
```

### `GET /health`
- **Description**: System & Database Health Check (Connectivity, Latency, Uptime, Platform info)
- **Status Code**: `200 OK`
- **JSON Response**:
```json
{
  "status": "healthy",
  "timestamp": "2026-08-31T07:13:43.692604+00:00",
  "uptime_seconds": 1,
  "version": "2.0.0",
  "checks": {
    "database": {
      "status": "healthy",
      "latency_ms": 0.4
    }
  },
  "system": {
    "python_version": "3.11.9",
    "platform": "Windows"
  }
}
```

### `GET /ready`
- **Description**: Probe returning readiness state for load balancer
- **Status Code**: `200 OK`
- **JSON Response**:
```json
{
  "ready": true
}
```

---

## 2. Authentication (`/auth`)

### `POST /auth/register`
- **Description**: User registration
- **Status Code**: `200 OK`
- **JSON Response**:
```json
{
  "id": 4,
  "user_name": "new_user_1788160423",
  "email": "new_1788160423@test.com",
  "role": "Patient",
  "is_active": true,
  "patient_profile_exists": false,
  "doctor_profile_exists": false
}
```

### `POST /auth/login`
- **Description**: User login returning JWT access & refresh tokens
- **Status Code**: `200 OK`
- **JSON Response**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### `POST /auth/refresh`
- **Description**: Generates new JWT token pair using a valid refresh token
- **Status Code**: `200 OK`
- **JSON Response**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### `GET /auth/me`
- **Description**: Retrieves current authenticated user details and profile existence flags
- **Status Code**: `200 OK`
- **JSON Response**:
```json
{
  "id": 3,
  "user_name": "patient_user",
  "email": "patient@hospital.com",
  "role": "Patient",
  "is_active": true,
  "patient_profile_exists": true,
  "doctor_profile_exists": false
}
```

### `POST /auth/admin/doctors`
- **Description**: Admin endpoint to create a doctor user account and linked profile
- **Status Code**: `200 OK`
- **JSON Response**:
```json
{
  "name": "Dr. House",
  "department_id": 1,
  "experience_years": 12,
  "date_of_birth": "1980-01-01",
  "consultation_fee": 800,
  "is_available": true,
  "user_id": 5,
  "id": 2,
  "qualification": "MBBS MD",
  "phone": "9998887770",
  "email": null,
  "room_number": 202,
  "is_active": true
}
```

---

## 3. Doctors

### `GET /doctors`
- **Description**: Retrieves paginated list of doctors
- **Status Code**: `200 OK`
- **JSON Response**:
```json
{
  "page": 1,
  "page_size": 20,
  "total_records": 2,
  "total_pages": 1,
  "next_page": null,
  "previous_page": null,
  "items": [
    {
      "name": "Dr. Smith",
      "department_id": 1,
      "experience_years": 10,
      "date_of_birth": "1985-05-20",
      "consultation_fee": 500,
      "is_available": true,
      "user_id": 2,
      "id": 1,
      "qualification": "MD Cardiology",
      "phone": "1234567890",
      "email": "doctor@hospital.com",
      "room_number": 101,
      "is_active": true
    }
  ]
}
```

### `GET /doctors/{doctor_id}`
- **Description**: Retrieves specific doctor profile details by ID
- **Status Code**: `200 OK`
- **JSON Response**:
```json
{
  "name": "Dr. Smith",
  "department_id": 1,
  "experience_years": 10,
  "date_of_birth": "1985-05-20",
  "consultation_fee": 500,
  "is_available": true,
  "user_id": 2,
  "id": 1,
  "qualification": "MD Cardiology",
  "phone": "1234567890",
  "email": "doctor@hospital.com",
  "room_number": 101,
  "is_active": true
}
```

### `GET /doctors_by_department`
- **Description**: Get list of doctors belonging to a specific department
- **Status Code**: `200 OK`
- **JSON Response**:
```json
[
  {
    "name": "Dr. Smith",
    "department_id": 1,
    "experience_years": 10,
    "date_of_birth": "1985-05-20",
    "consultation_fee": 500,
    "is_available": true,
    "user_id": 2,
    "id": 1,
    "qualification": "MD Cardiology",
    "phone": "1234567890",
    "email": "doctor@hospital.com",
    "room_number": 101,
    "is_active": true
  }
]
```

### `PATCH /doctors/{doctor_id}`
- **Description**: Updates doctor profile fields
- **Status Code**: `200 OK`
- **JSON Response**:
```json
{
  "name": "Dr. Smith",
  "department_id": 1,
  "experience_years": 10,
  "date_of_birth": "1985-05-20",
  "consultation_fee": 600,
  "is_available": true,
  "user_id": 2,
  "id": 1,
  "qualification": "MD Cardiology",
  "phone": "1234567890",
  "email": "doctor@hospital.com",
  "room_number": 101,
  "is_active": true
}
```

### `PATCH /doctors/{doctor_id}/deactivate`
- **Description**: Deactivates a doctor profile
- **Status Code**: `200 OK`
- **JSON Response**:
```json
{
  "name": "Dr. Smith",
  "id": 1,
  "is_active": false
}
```

---

## 4. Patients

### `GET /patients`
- **Description**: Retrieves paginated list of patients
- **Status Code**: `200 OK`
- **JSON Response**:
```json
{
  "page": 1,
  "page_size": 20,
  "total_records": 1,
  "total_pages": 1,
  "next_page": null,
  "previous_page": null,
  "items": [
    {
      "id": 1,
      "mobile_no": "9876543210",
      "gender": "Male",
      "name": "John Doe",
      "date_of_birth": "1990-01-15",
      "address": "123 Main St",
      "user_id": 3
    }
  ]
}
```

### `GET /patients/{patient_id}`
- **Description**: Retrieves single patient record by ID
- **Status Code**: `200 OK`
- **JSON Response**:
```json
{
  "id": 1,
  "mobile_no": "9876543210",
  "gender": "Male",
  "name": "John Doe",
  "date_of_birth": "1990-01-15",
  "address": "123 Main St",
  "user_id": 3
}
```

### `PATCH /patient/profile`
- **Description**: Updates patient profile for current logged-in user
- **Status Code**: `200 OK`
- **JSON Response**:
```json
{
  "id": 1,
  "mobile_no": "9876543210",
  "gender": "Male",
  "name": "John Doe",
  "date_of_birth": "1990-01-15",
  "address": "789 Pine St",
  "user_id": 3
}
```

---

## 5. Appointments

### `POST /appointment`
- **Description**: Schedules a new appointment
- **Status Code**: `200 OK`
- **JSON Response**:
```json
{
  "id": 2,
  "appointment_date": "2026-08-31",
  "appointment_time": "14:00:00",
  "appointment_type": "Consultation",
  "patient_id": 1,
  "doctor_id": 1,
  "reason": "Routine Consultation",
  "status": "Scheduled"
}
```

### `GET /appointments`
- **Description**: Paginated list of appointments
- **Status Code**: `200 OK`
- **JSON Response**:
```json
{
  "page": 1,
  "page_size": 20,
  "total_records": 2,
  "total_pages": 1,
  "items": [
    {
      "id": 1,
      "appointment_date": "2026-08-31",
      "appointment_time": "10:00:00",
      "appointment_type": "Consultation",
      "doctor_id": 1,
      "patient_id": 1,
      "reason": "Regular checkup",
      "status": "Scheduled"
    }
  ]
}
```

### `GET /doctor/me/appointments`
- **Description**: Gets appointments for logged-in doctor
- **Status Code**: `200 OK`
- **JSON Response**:
```json
[
  {
    "id": 1,
    "appointment_date": "2026-08-31",
    "appointment_time": "10:00:00",
    "appointment_type": "Consultation",
    "doctor_id": 1,
    "patient_id": 1,
    "reason": "Regular checkup",
    "status": "Scheduled"
  }
]
```

### `GET /patient/me/appointments`
- **Description**: Gets appointments for logged-in patient
- **Status Code**: `200 OK`
- **JSON Response**:
```json
[
  {
    "id": 1,
    "appointment_date": "2026-08-31",
    "appointment_time": "10:00:00",
    "appointment_type": "Consultation",
    "doctor_id": 1,
    "patient_id": 1,
    "reason": "Regular checkup",
    "status": "Scheduled"
  }
]
```

### `PATCH /appointments/{appointment_id}/reschedule`
- **Description**: Reschedules date/time of an appointment
- **Status Code**: `200 OK`
- **JSON Response**:
```json
{
  "id": 1,
  "appointment_date": "2026-08-31",
  "appointment_time": "15:00:00",
  "appointment_type": "Consultation",
  "patient_id": 1,
  "doctor_id": 1,
  "reason": "Regular checkup",
  "status": "Scheduled"
}
```

### `PATCH /appointments/{appointment_id}/cancel`
- **Description**: Cancels an appointment
- **Status Code**: `200 OK`
- **JSON Response**:
```json
{
  "id": 2,
  "appointment_date": "2026-08-31",
  "appointment_time": "14:00:00",
  "appointment_type": "Consultation",
  "patient_id": 1,
  "doctor_id": 1,
  "reason": "Routine Consultation",
  "status": "Cancelled"
}
```

---

## 6. Doctor Schedules

### `POST /doctor-schedules`
- **Description**: Creates a doctor work schedule slot
- **Status Code**: `200 OK`
- **JSON Response**:
```json
{
  "id": 2,
  "doctor_id": 1,
  "day_of_week": "Tuesday",
  "start_time": "10:00:00",
  "end_time": "16:00:00"
}
```

### `GET /doctors/me/schedules`
- **Description**: Retrieves schedule slots for logged-in doctor
- **Status Code**: `200 OK`
- **JSON Response**:
```json
[
  {
    "id": 1,
    "doctor_id": 1,
    "day_of_week": "Monday",
    "start_time": "09:00:00",
    "end_time": "17:00:00"
  },
  {
    "id": 2,
    "doctor_id": 1,
    "day_of_week": "Tuesday",
    "start_time": "10:00:00",
    "end_time": "16:00:00"
  }
]
```

---

## 7. Dashboard & Analytics (`/dashboard`)

### `GET /dashboard/doctor`
- **Description**: Doctor summary dashboard
- **Status Code**: `200 OK`
- **JSON Response**:
```json
{
  "name": "Dr. Smith",
  "department": "Cardiology",
  "today_appointments": 2,
  "upcoming_appointments": 2,
  "completed_today": 0,
  "cancelled_today": 1,
  "pending_today": 1
}
```

### `GET /dashboard/patient`
- **Description**: Patient summary dashboard
- **Status Code**: `200 OK`
- **JSON Response**:
```json
{
  "name": "John Doe",
  "next_appointment_date": "2026-08-31",
  "next_appointment_time": "15:00:00",
  "doctor_name": "Dr. Smith",
  "total_appointments": 2,
  "completed_appointments": 0,
  "cancelled_appointments": 1
}
```

### `GET /dashboard/admin`
- **Description**: Admin executive summary dashboard
- **Status Code**: `200 OK`
- **JSON Response**:
```json
{
  "total_doctors": 2,
  "active_doctors": 2,
  "inactive_doctors": 0,
  "total_patients": 1,
  "today_appointments": 2,
  "completed_today": 0,
  "cancelled_today": 1,
  "scheduled_today": 1,
  "total_departments": 1
}
```

### `GET /dashboard/overview`
- **Description**: Hospital overview metrics
- **Status Code**: `200 OK`
- **JSON Response**:
```json
{
  "total_patients": 1,
  "total_doctors": 2,
  "total_appointments": 2,
  "today_appointments": 2,
  "pending_bills": 0,
  "paid_bills": 1,
  "revenue": 1050,
  "unread_notifications": 1,
  "medical_records": 1,
  "reports_uploaded": 1,
  "prescriptions_created": 1
}
```

### `GET /dashboard/revenue`
- **Description**: Financial revenue chart & growth analytics
- **Status Code**: `200 OK`
- **JSON Response**:
```json
{
  "total_revenue": 1050,
  "period": "monthly",
  "chart": {
    "labels": ["2026-08"],
    "values": [1050]
  },
  "average_revenue": 1050.0,
  "growth_percentage": null
}
```

---

## 8. Medical Records (`/medical-records`)

### `POST /medical-records/`
- **Description**: Creates a new patient consultation record
- **Status Code**: `201 Created`
- **JSON Response**:
```json
{
  "id": 2,
  "patient_id": 1,
  "doctor_id": 1,
  "visit_date": "2026-08-31",
  "chief_complaint": "Headache and fatigue",
  "diagnosis": "Stress and dehydration",
  "treatment": "Rest and hydration",
  "allergies": "Penicillin",
  "notes": "Monitor for 3 days"
}
```

### `GET /medical-records/{medical_record_id}`
- **Description**: Gets single medical record details
- **Status Code**: `200 OK`
- **JSON Response**:
```json
{
  "id": 1,
  "patient_id": 1,
  "doctor_id": 1,
  "visit_date": "2026-08-31",
  "chief_complaint": "Chest pain",
  "diagnosis": "Mild hypertension",
  "treatment": "Lifestyle change and medication",
  "allergies": "None",
  "notes": "Follow up in 2 weeks"
}
```

### `GET /medical-records/patient/{patient_id}`
- **Description**: Gets paginated patient medical history with prescriptions nested
- **Status Code**: `200 OK`
- **JSON Response**:
```json
{
  "page": 1,
  "page_size": 20,
  "total_records": 2,
  "total_pages": 1,
  "items": [
    {
      "id": 1,
      "patient_id": 1,
      "doctor_id": 1,
      "visit_date": "2026-08-31",
      "chief_complaint": "Chest pain",
      "diagnosis": "Mild hypertension",
      "treatment": "Lifestyle change and medication",
      "allergies": "None",
      "notes": "Follow up in 2 weeks",
      "prescriptions": [
        {
          "id": 1,
          "medical_record_id": 1,
          "diagnosis": "Mild hypertension",
          "instructions": "Take after meals",
          "status": "active"
        }
      ]
    }
  ]
}
```

### `DELETE /medical-records/{medical_record_id}`
- **Description**: Deletes a medical record
- **Status Code**: `200 OK`
- **JSON Response**:
```json
{
  "message": "Medical record deleted successfully."
}
```

---

## 9. Prescriptions (`/prescriptions`)

### `GET /prescriptions/{prescription_id}`
- **Description**: Retrieves single prescription by ID with medicine items
- **Status Code**: `200 OK`
- **JSON Response**:
```json
{
  "id": 1,
  "patient_id": 1,
  "doctor_id": 1,
  "medical_record_id": 1,
  "prescription_date": "2026-08-31",
  "diagnosis": "Mild hypertension",
  "instructions": "Take after meals",
  "follow_up_date": "2026-08-31",
  "status": "active",
  "created_at": "2026-08-31",
  "prescription_items": [
    {
      "id": 1,
      "prescription_id": 1,
      "medicine_name": "Amlodipine",
      "dosage": "5mg",
      "frequency": "Once daily",
      "duration": "30 days",
      "route": "Oral",
      "notes": "Morning dose"
    }
  ]
}
```

### `DELETE /prescriptions/{prescription_id}`
- **Description**: Deletes prescription record
- **Status Code**: `200 OK`
- **JSON Response**:
```json
{
  "message": "Prescription deleted successfully."
}
```

---

## 10. Billing (`/billing`)

### `GET /billing/{billing_id}`
- **Description**: Invoice details by ID
- **Status Code**: `200 OK`
- **JSON Response**:
```json
{
  "id": 1,
  "patient_id": 1,
  "doctor_id": 1,
  "appointment_id": 1,
  "consultation_fee": 500,
  "medicine_charge": 200,
  "test_charge": 300,
  "other_charge": 50,
  "total_amount": 1050,
  "payment_status": "paid",
  "payment_method": "Credit Card",
  "created_at": "2026-08-31",
  "paid_at": "2026-08-31"
}
```

### `DELETE /billing/{billing_id}`
- **Description**: Deletes billing entry (Admin)
- **Status Code**: `200 OK`
- **JSON Response**:
```json
{
  "message": "Billing deleted successfully"
}
```

---

## 11. Notifications (`/notifications`)

### `POST /notifications/`
- **Description**: Dispatches a new notification
- **Status Code**: `200 OK`
- **JSON Response**:
```json
{
  "id": 2,
  "user_id": 3,
  "title": "Lab Results Ready",
  "message": "Your blood test report is ready for viewing.",
  "notification_type": "report",
  "is_read": false,
  "created_at": "2026-08-31T07:13:44.836654"
}
```

### `PATCH /notifications/{notification_id}/read`
- **Description**: Marks notification as read
- **Status Code**: `200 OK`
- **JSON Response**:
```json
{
  "id": 1,
  "user_id": 3,
  "title": "Appointment Confirmed",
  "message": "Your appointment with Dr. Smith is confirmed.",
  "notification_type": "appointment",
  "is_read": true,
  "created_at": "2026-08-31T07:13:43.579853"
}
```

---

## 12. Reports & Files (`/reports`)

### `POST /reports/`
- **Description**: Uploads lab report file
- **Status Code**: `201 Created`
- **JSON Response**:
```json
{
  "id": 2,
  "patient_id": 1,
  "report_type": "Blood Report",
  "original_filename": "uploaded_report.pdf",
  "stored_filename": "patient_1_bdr_9dad54d39d144337a90612502485d272.pdf",
  "file_path": "uploads\\reports\\patient_1_bdr_9dad54d39d144337a90612502485d272.pdf",
  "content_type": "application/pdf",
  "file_size": 46,
  "version": 1,
  "status": "Uploaded",
  "notes": "Routine CBC panel",
  "uploaded_by": 3,
  "uploaded_at": "2026-08-31T07:13:44.902542"
}
```

### `GET /reports/{report_id}`
- **Description**: Report metadata lookup
- **Status Code**: `200 OK`
- **JSON Response**:
```json
{
  "id": 1,
  "patient_id": 1,
  "report_type": "Blood Report",
  "original_filename": "test_report.pdf",
  "stored_filename": "test_report_stored.pdf",
  "file_path": "uploads\\test_report.pdf",
  "content_type": "application/pdf",
  "file_size": 35,
  "version": 1,
  "status": "Uploaded",
  "notes": "Blood count normal",
  "uploaded_by": 3,
  "uploaded_at": "2026-08-31T07:13:43.596518"
}
```

---

## 13. Audit Trail (`/audit`)

### `GET /audit/logs`
- **Description**: Paginated audit log search (Admin)
- **Status Code**: `200 OK`
- **JSON Response**:
```json
{
  "page": 1,
  "page_size": 20,
  "total_records": 1,
  "total_pages": 1,
  "items": [
    {
      "id": 1,
      "user_id": 1,
      "action": "LOGIN",
      "resource": "User",
      "resource_id": 1,
      "details": "Admin login successful",
      "ip_address": "127.0.0.1",
      "user_agent": "TestClient",
      "method": "POST",
      "path": "/auth/login",
      "status_code": 200,
      "duration_ms": 45,
      "created_at": "2026-08-31T07:13:43.596518"
    }
  ]
}
```

### `GET /audit/summary`
- **Description**: Audit event summary stats (Admin)
- **Status Code**: `200 OK`
- **JSON Response**:
```json
{
  "total_actions": 1,
  "actions_today": 1,
  "top_actions": [
    {
      "action": "LOGIN",
      "count": 1
    }
  ],
  "top_users": [
    {
      "user_id": 1,
      "count": 1
    }
  ]
}
```

---

## 14. AI Features (`/ai`)

### `GET /ai/status`
- **Description**: Active AI provider and feature status
- **Status Code**: `200 OK`
- **JSON Response**:
```json
{
  "enabled": false,
  "provider": "openai",
  "features": {
    "chat": false,
    "search": false,
    "ocr": false,
    "rag": false
  },
  "collections": [
    "medical_records",
    "prescriptions",
    "reports",
    "knowledge_base"
  ]
}
```

### `GET /ai/usage`
- **Description**: AI token and API usage statistics (Admin)
- **Status Code**: `200 OK`
- **JSON Response**:
```json
{
  "total_requests": 0,
  "total_tokens": 0,
  "total_cost": 0.0,
  "requests_today": 0,
  "average_latency_ms": 0.0
}
```
