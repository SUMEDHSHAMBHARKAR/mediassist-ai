from fastapi import (
    APIRouter,
    Depends,
    Query,
    status,
)
from sqlalchemy.orm import Session

from app.database import get_db

from app.medical_records import (
    service,
    schemas,
)

from app.auth import (
    dependencies,
    models as auth_models,
)

router = APIRouter(
    prefix="/medical-records",
    tags=["Medical Records"],
)


# =====================================================
# Create Medical Record
# =====================================================

@router.post(
    "/",
    response_model=schemas.MedicalRecordResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_medical_record(
    medical_record: schemas.MedicalRecordCreate,
    db: Session = Depends(get_db),
    current_user: auth_models.User = Depends(
        dependencies.get_current_user
    ),
):

    return service.create_medical_record(
        db=db,
        medical_record=medical_record,
    )


# =====================================================
# Get Medical Record By ID
# =====================================================

@router.get(
    "/{medical_record_id}",
    response_model=schemas.MedicalRecordResponse,
)
def get_medical_record(
    medical_record_id: int,
    db: Session = Depends(get_db),
    current_user: auth_models.User = Depends(
        dependencies.get_current_user
    ),
):

    return service.get_medical_record(
        db=db,
        medical_record_id=medical_record_id,
    )


# =====================================================
# Get Patient Medical Records
# =====================================================

@router.get(
    "/patient/{patient_id}",
)
def get_patient_medical_records(
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

    return service.get_patient_medical_records(
        db=db,
        patient_id=patient_id,
        page=page,
        page_size=page_size,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
    )


# =====================================================
# Update Medical Record
# =====================================================

@router.put(
    "/{medical_record_id}",
    response_model=schemas.MedicalRecordResponse,
)
def update_medical_record(
    medical_record_id: int,
    update_data: schemas.MedicalRecordUpdate,
    db: Session = Depends(get_db),
    current_user: auth_models.User = Depends(
        dependencies.get_current_user
    ),
):

    return service.update_medical_record(
        db=db,
        medical_record_id=medical_record_id,
        update_data=update_data,
    )


# =====================================================
# Delete Medical Record
# =====================================================

@router.delete(
    "/{medical_record_id}",
)
def delete_medical_record(
    medical_record_id: int,
    db: Session = Depends(get_db),
    current_user: auth_models.User = Depends(
        dependencies.get_current_user
    ),
):

    return service.delete_medical_record(
        db=db,
        medical_record_id=medical_record_id,
    )