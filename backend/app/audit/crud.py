from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, datetime, timezone

from app.audit import models
from app.core.query_builder import build_query

AUDIT_SEARCH_FIELDS = ["action", "resource", "details", "path"]


# =====================================================
# Create
# =====================================================

def create_audit_log(db: Session, audit_log: models.AuditLog) -> models.AuditLog:
    db.add(audit_log)
    db.commit()
    db.refresh(audit_log)
    return audit_log


def create_audit_log_no_commit(db: Session, audit_log: models.AuditLog) -> None:
    db.add(audit_log)


# =====================================================
# Read
# =====================================================

def get_audit_logs(
    db: Session,
    page: int = 1,
    page_size: int = 20,
    search: str | None = None,
    sort_by: str | None = None,
    sort_order: str = "desc",
    filters: dict | None = None,
):
    return build_query(
        db=db,
        model=models.AuditLog,
        filters=filters,
        search=search,
        search_fields=AUDIT_SEARCH_FIELDS,
        sort_by=sort_by if sort_by else "created_at",
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )


def get_user_audit_logs(
    db: Session,
    user_id: int,
    page: int = 1,
    page_size: int = 20,
):
    base_query = (
        db.query(models.AuditLog)
        .filter(models.AuditLog.user_id == user_id)
    )

    return build_query(
        db=db,
        model=models.AuditLog,
        sort_by="created_at",
        sort_order="desc",
        page=page,
        page_size=page_size,
        base_query=base_query,
    )


def get_resource_audit_logs(
    db: Session,
    resource: str,
    resource_id: int | None = None,
    page: int = 1,
    page_size: int = 20,
):
    base_query = db.query(models.AuditLog).filter(
        models.AuditLog.resource == resource
    )
    if resource_id is not None:
        base_query = base_query.filter(models.AuditLog.resource_id == resource_id)

    return build_query(
        db=db,
        model=models.AuditLog,
        sort_by="created_at",
        sort_order="desc",
        page=page,
        page_size=page_size,
        base_query=base_query,
    )


# =====================================================
# Analytics
# =====================================================

def get_total_actions(db: Session) -> int:
    return db.query(func.count(models.AuditLog.id)).scalar()


def get_actions_today(db: Session) -> int:
    today = date.today()
    return (
        db.query(func.count(models.AuditLog.id))
        .filter(func.date(models.AuditLog.created_at) == today)
        .scalar()
    )


def get_top_actions(db: Session, limit: int = 10) -> list[tuple]:
    return (
        db.query(
            models.AuditLog.action,
            func.count(models.AuditLog.id).label("count"),
        )
        .group_by(models.AuditLog.action)
        .order_by(func.count(models.AuditLog.id).desc())
        .limit(limit)
        .all()
    )


def get_top_users(db: Session, limit: int = 10) -> list[tuple]:
    return (
        db.query(
            models.AuditLog.user_id,
            func.count(models.AuditLog.id).label("count"),
        )
        .filter(models.AuditLog.user_id.isnot(None))
        .group_by(models.AuditLog.user_id)
        .order_by(func.count(models.AuditLog.id).desc())
        .limit(limit)
        .all()
    )
