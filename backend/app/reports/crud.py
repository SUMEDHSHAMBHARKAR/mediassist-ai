from sqlalchemy.orm import Session, load_only
from app.reports import models
from app.core.query_builder import build_query

REPORT_SEARCH_FIELDS = ["original_filename", "notes"]

REPORT_LIST_COLUMNS = [
    models.Report.id,
    models.Report.patient_id,
    models.Report.report_type,
    models.Report.original_filename,
    models.Report.stored_filename,
    models.Report.file_path,
    models.Report.content_type,
    models.Report.file_size,
    models.Report.version,
    models.Report.status,
    models.Report.notes,
    models.Report.uploaded_by,
    models.Report.uploaded_at,
]


# -----------------------------
# Create
# -----------------------------

def create_report(db: Session, report: models.Report) -> models.Report:

    db.add(report)
    db.commit()
    db.refresh(report)

    return report


# -----------------------------
# Read
# -----------------------------

def get_report_by_id(db: Session, report_id: int) -> models.Report | None:
    return (
        db.query(models.Report)
        .filter(models.Report.id == report_id)
        .first()
    )


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
    base_query = (
        db.query(models.Report)
        .options(load_only(*REPORT_LIST_COLUMNS))
        .filter(models.Report.patient_id == patient_id)
    )

    return build_query(
        db=db,
        model=models.Report,
        filters=filters,
        search=search,
        search_fields=REPORT_SEARCH_FIELDS,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
        base_query=base_query,
    )


def get_reports_by_type(db: Session, patient_id: int, report_type: models.ReportType) -> list[models.Report]:
    return (
        db.query(models.Report)
        .filter(
            models.Report.patient_id == patient_id,
            models.Report.report_type == report_type,
        )
        .order_by(models.Report.uploaded_at.desc())
        .all()
    )


def get_latest_report(db: Session, patient_id: int, report_type: models.ReportType) -> models.Report | None:
    return (
        db.query(models.Report)
        .filter(
            models.Report.patient_id == patient_id,
            models.Report.report_type == report_type,
        )
        .order_by(models.Report.version.desc())
        .first()
    )


# -----------------------------
# Update
# -----------------------------

def update_report(db: Session, report: models.Report) -> models.Report:

    db.commit()
    db.refresh(report)

    return report


# -----------------------------
# Delete
# -----------------------------

def delete_report(db: Session, report: models.Report) -> None:
    db.delete(report)
    db.commit()
