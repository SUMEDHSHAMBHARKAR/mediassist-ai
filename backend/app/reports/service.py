from sqlalchemy.orm import Session
from fastapi import UploadFile,HTTPException,status
from app.reports import crud,models,utils
from app.auth import crud as auth_crud
from app.patients import crud as patient_crud


# =====================================================
# Upload Report
# =====================================================

def upload_report(db: Session,file: UploadFile,patient_id: int,report_type: str,uploaded_by: int,notes: str | None = None,
) -> models.Report:

    # -------------------------------------------------
    # Validate Patient
    # -------------------------------------------------

    patient = patient_crud.get_patient_by_id(
        db=db,
        patient_id=patient_id,
    )

    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found."
        )

    # -------------------------------------------------
    # Validate Uploader
    # -------------------------------------------------

    user = auth_crud.get_user_by_id(
        db=db,
        user_id=uploaded_by,
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )

    # -------------------------------------------------
    # Validate File
    # -------------------------------------------------

    file_size = utils.validate_file(file)

    # -------------------------------------------------
    # Generate Filename
    # -------------------------------------------------

    stored_filename = utils.generate_stored_filename(
        patient_id=patient_id,
        report_type=report_type,
        original_filename=file.filename,
    )

    # -------------------------------------------------
    # Save File
    # -------------------------------------------------

    file_path = utils.save_file(
        file=file,
        stored_filename=stored_filename,
    )

    # -------------------------------------------------
    # Create Report Model
    # -------------------------------------------------

    report = models.Report(
        patient_id=patient_id,
        report_type=report_type,
        original_filename=file.filename,
        stored_filename=stored_filename,
        file_path=file_path,
        content_type=file.content_type,
        file_size=file_size,
        uploaded_by=uploaded_by,
        notes=notes,
    )

    # -------------------------------------------------
    # Save Report
    # -------------------------------------------------

    try:

        report = crud.create_report(
            db=db,
            report=report,
        )

        return report

    except Exception:

        utils.delete_file(file_path)

        raise


# =====================================================
# Get Report
# =====================================================

def get_report(db: Session,report_id: int,) -> models.Report:

    report = crud.get_report_by_id(
        db=db,
        report_id=report_id,
    )

    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found."
        )

    return report


# =====================================================
# Get Patient Reports
# =====================================================

def get_patient_reports(
    db: Session,
    patient_id: int,
    page: int = 1,
    page_size: int = 20,
    search: str | None = None,
    sort_by: str | None = None,
    sort_order: str = "asc",
    filters: dict | None = None,
):

    patient = patient_crud.get_patient_by_id(db=db, patient_id=patient_id,)

    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found."
        )

    return crud.get_patient_reports(
        db=db,
        patient_id=patient_id,
        page=page,
        page_size=page_size,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
        filters=filters,
    )


# =====================================================
# Delete Report
# =====================================================

def delete_report(db: Session,report_id: int,):

    report = crud.get_report_by_id(db=db,report_id=report_id,)

    if report is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="Report not found.")

    utils.delete_file(report.file_path)

    crud.delete_report(db=db,report=report)
    return {
        "message": "Report deleted successfully."
    }