from fastapi import (
    APIRouter,
    Depends,
    Query,
    status,
)
from sqlalchemy.orm import Session

from app.database import get_db

from app.prescriptions import (
    service,
    schemas,
)

from app.auth import (
    dependencies,
    models as auth_models,
)

router = APIRouter(
    prefix="/prescriptions",
    tags=["Prescriptions"],
)


# =====================================================
# Create Prescription
# =====================================================

@router.post(
    "/",
    response_model=schemas.PrescriptionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_prescription(
    prescription: schemas.PrescriptionCreate,
    db: Session = Depends(get_db),
    current_user: auth_models.User = Depends(
        dependencies.get_current_user
    ),
):
    return service.create_prescription(
        db=db,
        prescription=prescription,
    )


# =====================================================
# Get Prescription By ID
# =====================================================

@router.get(
    "/{prescription_id}",
    response_model=schemas.PrescriptionResponse,
)
def get_prescription(
    prescription_id: int,
    db: Session = Depends(get_db),
    current_user: auth_models.User = Depends(
        dependencies.get_current_user
    ),
):
    return service.get_prescription(
        db=db,
        prescription_id=prescription_id,
    )


# =====================================================
# Get Patient Prescriptions
# =====================================================

@router.get(
    "/patient/{patient_id}",
)
def get_patient_prescriptions(
    patient_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    sort_by: str | None = None,
    sort_order: str = Query("asc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
    current_user: auth_models.User = Depends(
        dependencies.get_current_user
    ),
):
    return service.get_patient_prescriptions(
        db=db,
        patient_id=patient_id,
        page=page,
        page_size=page_size,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
    )


# =====================================================
# Get Doctor Prescriptions
# =====================================================

@router.get(
    "/doctor/{doctor_id}",
)
def get_doctor_prescriptions(
    doctor_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    sort_by: str | None = None,
    sort_order: str = Query("asc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
    current_user: auth_models.User = Depends(
        dependencies.get_current_user
    ),
):
    return service.get_doctor_prescriptions(
        db=db,
        doctor_id=doctor_id,
        page=page,
        page_size=page_size,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
    )


# =====================================================
# Update Prescription
# =====================================================

@router.put(
    "/{prescription_id}",
    response_model=schemas.PrescriptionResponse,
)
def update_prescription(
    prescription_id: int,
    update_data: schemas.PrescriptionUpdate,
    db: Session = Depends(get_db),
    current_user: auth_models.User = Depends(
        dependencies.get_current_user
    ),
):
    return service.update_prescription(
        db=db,
        prescription_id=prescription_id,
        update_data=update_data,
    )


# =====================================================
# Delete Prescription
# =====================================================

@router.delete(
    "/{prescription_id}",
)
def delete_prescription(
    prescription_id: int,
    db: Session = Depends(get_db),
    current_user: auth_models.User = Depends(
        dependencies.get_current_user
    ),
):
    return service.delete_prescription(
        db=db,
        prescription_id=prescription_id,
    )
