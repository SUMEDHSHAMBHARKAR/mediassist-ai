from app.auth import models,security,schemas
from fastapi import HTTPException



def authorize_appointment_owner(appointment,current_user):
    if current_user.role == schemas.UserRole.admin:
            pass
    elif current_user.role == schemas.UserRole.patient:
        patient =  current_user.patient
        if patient is None :
            raise HTTPException(
                status_code=404,
                detail="Patient profile not found"
            )
        if appointment.patient_id != patient.id:
            raise HTTPException (
                status_code=403,
                detail="You are not allowed to access this appointment"
            )
    elif current_user.role == schemas.UserRole.doctor:
        doctor = current_user.doctor
        if doctor is None:
            raise HTTPException(
                status_code=404,
                detail="doctor profile not found"
            )
        if appointment.doctor_id != doctor.id:
            raise HTTPException(
                status_code=403,
                detail="You are not allowed to access this appointment"
            )
    else:
        raise HTTPException(
        status_code=403,
        detail="Access denied"
        )
    

def authorize_schedule_owner(schedule,current_user):
    if current_user.role == schemas.UserRole.admin:
            pass
    elif current_user.role == schemas.UserRole.doctor:
        doctor = current_user.doctor
        if doctor is None:
            raise HTTPException(
                status_code=404,
                detail="doctor profile not found"
            )
        if schedule.doctor_id != doctor.id:
            raise HTTPException(
                status_code=403,
                detail="You are not allowed to access this appointment"
            )
    else:
        raise HTTPException(
        status_code=403,
        detail="Access denied"
        )
    

def authorize_appointment_status_update(appointment,current_user):
    if current_user.role == schemas.UserRole.admin:
        pass
    elif current_user.role == schemas.UserRole.patient:
        raise HTTPException(
                status_code=403,
                detail="Access denied"
                )
    elif current_user.role == schemas.UserRole.doctor:
        doctor = current_user.doctor
        if doctor is None:
            raise HTTPException(
                status_code=404,
                detail="doctor profile not found"
            )
        if appointment.doctor_id != doctor.id:
            raise HTTPException(
                status_code=403,
                detail="You are not allowed to access this appointment"
            )
    else:
        raise HTTPException(
        status_code=403,
        detail="Access denied"
        )

def authorize_medical_record_access(current_user,medical_record):
    if current_user.role == schemas.UserRole.admin:
        pass
    elif current_user.role == schemas.UserRole.patient:
        patient =  current_user.patient
        if patient is None :
            raise HTTPException(
                status_code=404,
                detail="Patient profile not found"
            )
        if medical_record.patient_id != patient.id:
            raise HTTPException (
                status_code=403,
                detail="You are not allowed to access this appointment"
            )
    elif current_user.role == schemas.UserRole.doctor:
        doctor = current_user.doctor
        if doctor is None:
            raise HTTPException(
                status_code=404,
                detail="doctor profile not found"
            )
        if medical_record.doctor_id != doctor.id:
            raise HTTPException(
                status_code=403,
                detail="You are not allowed to access this medical record"
            )
    else:
        raise HTTPException(
        status_code=403,
        detail="Access denied"
        )
        

def authorize_prescription_access(current_user,prescription):
    if current_user.role == schemas.UserRole.admin:
        pass
    elif current_user.role == schemas.UserRole.patient:
        patient =  current_user.patient
        if patient is None :
            raise HTTPException(
                status_code=404,
                detail="Patient profile not found"
            )
        if prescription.patient_id != patient.id:
            raise HTTPException (
                status_code=403,
                detail="You are not allowed to access this appointment"
            )
    elif current_user.role == schemas.UserRole.doctor:
        doctor = current_user.doctor
        if doctor is None:
            raise HTTPException(
                status_code=404,
                detail="doctor profile not found"
            )
        if prescription.doctor_id != doctor.id:
            raise HTTPException(
                status_code=403,
                detail="You are not allowed to access this medical record"
            )
    else:
        raise HTTPException(
        status_code=403,
        detail="Access denied"
        )


def authorize_prescriptions_owner(prescriptions,current_user):
    if current_user.role == schemas.UserRole.admin:
            pass
    elif current_user.role == schemas.UserRole.patient:
        patient = current_user.patient
        if patient is None:
            raise HTTPException(
                status_code=404,
                detail="patient profile not found"
            )
        if prescriptions.patient_id != patient.id:
            raise HTTPException(
                status_code=403,
                detail="You are not allowed to access this appointment"
            )
    else:
        raise HTTPException(
        status_code=403,
        detail="Access denied"
        )



def authorize_billing_access(current_user,billing):
    if current_user.role == schemas.UserRole.admin:
        pass
    elif current_user.role == schemas.UserRole.patient:
        patient =  current_user.patient
        if patient is None :
            raise HTTPException(
                status_code=404,
                detail="Patient profile not found"
            )
        if billing.patient_id != patient.id:
            raise HTTPException (
                status_code=403,
                detail="You are not allowed to access this appointment"
            )
    elif current_user.role == schemas.UserRole.doctor:
        doctor = current_user.doctor
        if doctor is None:
            raise HTTPException(
                status_code=404,
                detail="doctor profile not found"
            )
        if billing.doctor_id != doctor.id:
            raise HTTPException(
                status_code=403,
                detail="You are not allowed to access this medical record"
            )
    else:
        raise HTTPException(
        status_code=403,
        detail="Access denied"
        )