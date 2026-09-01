from fastapi import (
    APIRouter,
    UploadFile,
    File,
    Form,
    Depends,
    Query,
)
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db

from app.auth import (
    models as auth_models,
    dependencies,
)

from app.reports import (
    service,
    schemas,
)

router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
)


# ======================================================
# Upload Report
# ======================================================

@router.post(
    "/",
    response_model=schemas.ReportResponse,
    status_code=201,
)
def upload_report(

    file: UploadFile = File(...),

    patient_id: int = Form(...),

    report_type: str = Form(...),

    notes: str | None = Form(None),

    db: Session = Depends(get_db),

    current_user: auth_models.User = Depends(
        dependencies.get_current_user
    ),
):

    return service.upload_report(
        db=db,
        file=file,
        patient_id=patient_id,
        report_type=report_type,
        uploaded_by=current_user.id,
        notes=notes,
    )


# ======================================================
# Get Report By ID
# ======================================================

@router.get(
    "/{report_id}",
    response_model=schemas.ReportResponse,
)
def get_report(

    report_id: int,

    db: Session = Depends(get_db),

):

    return service.get_report(
        db=db,
        report_id=report_id,
    )


# ======================================================
# Get Patient Reports
# ======================================================

@router.get(
    "/patient/{patient_id}",
)
def get_patient_reports(

    patient_id: int,

    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    sort_by: str | None = None,
    sort_order: str = Query("asc", pattern="^(asc|desc)$"),
    report_type: str | None = None,

    db: Session = Depends(get_db),

):
    filters = {}
    if report_type:
        filters["report_type"] = report_type

    return service.get_patient_reports(
        db=db,
        patient_id=patient_id,
        page=page,
        page_size=page_size,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
        filters=filters,
    )


# ======================================================
# Download Report
# ======================================================

@router.get(
    "/download/{report_id}",
)
def download_report(

    report_id: int,

    db: Session = Depends(get_db),

):

    report = service.get_report(
        db=db,
        report_id=report_id,
    )

    return FileResponse(
        path=report.file_path,
        filename=report.original_filename,
        media_type=report.content_type,
    )


# ======================================================
# Delete Report
# ======================================================

@router.delete(
    "/{report_id}",
)
def delete_report(

    report_id: int,

    db: Session = Depends(get_db),

):

    return service.delete_report(
        db=db,
        report_id=report_id,
    )