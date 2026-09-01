"""add_prescriptions_module

Revision ID: 821f5be7be9c
Revises: d632982967b5
Create Date: 2026-08-04 15:33:16.137795

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '821f5be7be9c'
down_revision: Union[str, Sequence[str], None] = 'd632982967b5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('prescriptions',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('patient_id', sa.Integer(), nullable=False),
    sa.Column('doctor_id', sa.Integer(), nullable=False),
    sa.Column('medical_record_id', sa.Integer(), nullable=False),
    sa.Column('prescription_date', sa.Date(), nullable=False),
    sa.Column('diagnosis', sa.Text(), nullable=False),
    sa.Column('instructions', sa.Text(), nullable=True),
    sa.Column('follow_up_date', sa.Date(), nullable=True),
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('created_at', sa.Date(), nullable=False),
    sa.ForeignKeyConstraint(['doctor_id'], ['doctors.id'], ),
    sa.ForeignKeyConstraint(['medical_record_id'], ['medical_records.id'], ),
    sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_prescriptions_id'), 'prescriptions', ['id'], unique=False)
    op.create_table('prescription_items',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('prescription_id', sa.Integer(), nullable=False),
    sa.Column('medicine_name', sa.String(), nullable=False),
    sa.Column('dosage', sa.String(), nullable=False),
    sa.Column('frequency', sa.String(), nullable=False),
    sa.Column('duration', sa.String(), nullable=False),
    sa.Column('route', sa.String(), nullable=True),
    sa.Column('notes', sa.Text(), nullable=True),
    sa.ForeignKeyConstraint(['prescription_id'], ['prescriptions.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_prescription_items_id'), 'prescription_items', ['id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_prescription_items_id'), table_name='prescription_items')
    op.drop_table('prescription_items')
    op.drop_index(op.f('ix_prescriptions_id'), table_name='prescriptions')
    op.drop_table('prescriptions')
