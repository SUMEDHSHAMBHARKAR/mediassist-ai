"""add_performance_indexes

Revision ID: ac82cd5c113d
Revises: 821f5be7be9c
Create Date: 2026-08-04 16:03:10.012732

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ac82cd5c113d'
down_revision: Union[str, Sequence[str], None] = '821f5be7be9c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add performance indexes to all tables."""
    # Appointments
    op.create_index(op.f('ix_appointments_appointment_date'), 'appointments', ['appointment_date'], unique=False)
    op.create_index(op.f('ix_appointments_doctor_id'), 'appointments', ['doctor_id'], unique=False)
    op.create_index(op.f('ix_appointments_patient_id'), 'appointments', ['patient_id'], unique=False)
    op.create_index(op.f('ix_appointments_status'), 'appointments', ['status'], unique=False)
    # Billings
    op.create_index(op.f('ix_billings_created_at'), 'billings', ['created_at'], unique=False)
    op.create_index(op.f('ix_billings_doctor_id'), 'billings', ['doctor_id'], unique=False)
    op.create_index(op.f('ix_billings_paid_at'), 'billings', ['paid_at'], unique=False)
    op.create_index(op.f('ix_billings_patient_id'), 'billings', ['patient_id'], unique=False)
    op.create_index(op.f('ix_billings_payment_status'), 'billings', ['payment_status'], unique=False)
    # Doctor Schedule
    op.create_index(op.f('ix_doctor_schedule_doctor_id'), 'doctor_schedule', ['doctor_id'], unique=False)
    # Doctors
    op.create_index(op.f('ix_doctors_department_id'), 'doctors', ['department_id'], unique=False)
    op.create_index(op.f('ix_doctors_email'), 'doctors', ['email'], unique=False)
    op.create_index(op.f('ix_doctors_is_active'), 'doctors', ['is_active'], unique=False)
    op.create_index(op.f('ix_doctors_name'), 'doctors', ['name'], unique=False)
    op.create_index(op.f('ix_doctors_user_id'), 'doctors', ['user_id'], unique=True)
    # Medical Records
    op.create_index(op.f('ix_medical_records_doctor_id'), 'medical_records', ['doctor_id'], unique=False)
    op.create_index(op.f('ix_medical_records_patient_id'), 'medical_records', ['patient_id'], unique=False)
    op.create_index(op.f('ix_medical_records_visit_date'), 'medical_records', ['visit_date'], unique=False)
    # Patients
    op.create_index(op.f('ix_patients_gender'), 'patients', ['gender'], unique=False)
    op.create_index(op.f('ix_patients_mobile_no'), 'patients', ['mobile_no'], unique=False)
    op.create_index(op.f('ix_patients_name'), 'patients', ['name'], unique=False)
    op.create_index(op.f('ix_patients_user_id'), 'patients', ['user_id'], unique=True)
    # Prescription Items
    op.create_index(op.f('ix_prescription_items_medicine_name'), 'prescription_items', ['medicine_name'], unique=False)
    op.create_index(op.f('ix_prescription_items_prescription_id'), 'prescription_items', ['prescription_id'], unique=False)
    # Prescriptions
    op.create_index(op.f('ix_prescriptions_created_at'), 'prescriptions', ['created_at'], unique=False)
    op.create_index(op.f('ix_prescriptions_doctor_id'), 'prescriptions', ['doctor_id'], unique=False)
    op.create_index(op.f('ix_prescriptions_medical_record_id'), 'prescriptions', ['medical_record_id'], unique=False)
    op.create_index(op.f('ix_prescriptions_patient_id'), 'prescriptions', ['patient_id'], unique=False)
    op.create_index(op.f('ix_prescriptions_prescription_date'), 'prescriptions', ['prescription_date'], unique=False)
    op.create_index(op.f('ix_prescriptions_status'), 'prescriptions', ['status'], unique=False)
    # Users
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_role'), 'users', ['role'], unique=False)
    op.create_index(op.f('ix_users_user_name'), 'users', ['user_name'], unique=True)
    # Notifications
    op.create_index(op.f('ix_notifications_user_id'), 'notifications', ['user_id'], unique=False)
    op.create_index(op.f('ix_notifications_is_read'), 'notifications', ['is_read'], unique=False)
    op.create_index(op.f('ix_notifications_notification_type'), 'notifications', ['notification_type'], unique=False)
    op.create_index(op.f('ix_notifications_created_at'), 'notifications', ['created_at'], unique=False)


def downgrade() -> None:
    """Remove performance indexes."""
    # Notifications
    op.drop_index(op.f('ix_notifications_created_at'), table_name='notifications')
    op.drop_index(op.f('ix_notifications_notification_type'), table_name='notifications')
    op.drop_index(op.f('ix_notifications_is_read'), table_name='notifications')
    op.drop_index(op.f('ix_notifications_user_id'), table_name='notifications')
    # Users
    op.drop_index(op.f('ix_users_user_name'), table_name='users')
    op.drop_index(op.f('ix_users_role'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    # Prescriptions
    op.drop_index(op.f('ix_prescriptions_status'), table_name='prescriptions')
    op.drop_index(op.f('ix_prescriptions_prescription_date'), table_name='prescriptions')
    op.drop_index(op.f('ix_prescriptions_patient_id'), table_name='prescriptions')
    op.drop_index(op.f('ix_prescriptions_medical_record_id'), table_name='prescriptions')
    op.drop_index(op.f('ix_prescriptions_doctor_id'), table_name='prescriptions')
    op.drop_index(op.f('ix_prescriptions_created_at'), table_name='prescriptions')
    # Prescription Items
    op.drop_index(op.f('ix_prescription_items_prescription_id'), table_name='prescription_items')
    op.drop_index(op.f('ix_prescription_items_medicine_name'), table_name='prescription_items')
    # Patients
    op.drop_index(op.f('ix_patients_user_id'), table_name='patients')
    op.drop_index(op.f('ix_patients_name'), table_name='patients')
    op.drop_index(op.f('ix_patients_mobile_no'), table_name='patients')
    op.drop_index(op.f('ix_patients_gender'), table_name='patients')
    # Medical Records
    op.drop_index(op.f('ix_medical_records_visit_date'), table_name='medical_records')
    op.drop_index(op.f('ix_medical_records_patient_id'), table_name='medical_records')
    op.drop_index(op.f('ix_medical_records_doctor_id'), table_name='medical_records')
    # Doctors
    op.drop_index(op.f('ix_doctors_user_id'), table_name='doctors')
    op.drop_index(op.f('ix_doctors_name'), table_name='doctors')
    op.drop_index(op.f('ix_doctors_is_active'), table_name='doctors')
    op.drop_index(op.f('ix_doctors_email'), table_name='doctors')
    op.drop_index(op.f('ix_doctors_department_id'), table_name='doctors')
    # Doctor Schedule
    op.drop_index(op.f('ix_doctor_schedule_doctor_id'), table_name='doctor_schedule')
    # Billings
    op.drop_index(op.f('ix_billings_payment_status'), table_name='billings')
    op.drop_index(op.f('ix_billings_patient_id'), table_name='billings')
    op.drop_index(op.f('ix_billings_paid_at'), table_name='billings')
    op.drop_index(op.f('ix_billings_doctor_id'), table_name='billings')
    op.drop_index(op.f('ix_billings_created_at'), table_name='billings')
    # Appointments
    op.drop_index(op.f('ix_appointments_status'), table_name='appointments')
    op.drop_index(op.f('ix_appointments_patient_id'), table_name='appointments')
    op.drop_index(op.f('ix_appointments_doctor_id'), table_name='appointments')
    op.drop_index(op.f('ix_appointments_appointment_date'), table_name='appointments')
