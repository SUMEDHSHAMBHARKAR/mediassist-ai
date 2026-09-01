from enum import Enum


# =====================================================
# User Roles
# =====================================================

class UserRole(str, Enum):
    admin = "Admin"
    doctor = "Doctor"
    patient = "Patient"


# =====================================================
# Appointment Status
# =====================================================

class AppointmentStatus(str, Enum):
    scheduled = "Scheduled"
    completed = "Completed"
    cancelled = "Cancelled"


# =====================================================
# Payment Status
# =====================================================

class PaymentStatus(str, Enum):
    pending = "pending"
    paid = "paid"
    cancelled = "cancelled"


# =====================================================
# Report Types
# =====================================================

class ReportType(str, Enum):
    blood_report = "Blood Report"
    mri = "MRI"
    ct_scan = "CT Scan"
    xray = "X-Ray"
    ecg = "ECG"
    prescription = "Prescription"
    other = "Other"


# =====================================================
# Report Status
# =====================================================

class ReportStatus(str, Enum):
    uploaded = "Uploaded"
    verified = "Verified"
    archived = "Archived"


# =====================================================
# Prescription Status
# =====================================================

class PrescriptionStatus(str, Enum):
    active = "active"
    completed = "completed"
    cancelled = "cancelled"


# =====================================================
# Sort Order
# =====================================================

class SortOrder(str, Enum):
    asc = "asc"
    desc = "desc"
