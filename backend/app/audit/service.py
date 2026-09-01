from sqlalchemy.orm import Session
from fastapi import Request

from app.audit import crud, models, schemas


# =====================================================
# Create Audit Entry
# =====================================================

def log_action(
    db: Session,
    action: str,
    resource: str,
    resource_id: int | None = None,
    user_id: int | None = None,
    details: str | None = None,
    request: Request | None = None,
) -> models.AuditLog:

    ip_address = None
    user_agent = None
    method = None
    path = None

    if request:
        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent", "")[:255]
        method = request.method
        path = str(request.url.path)

    audit_log = models.AuditLog(
        user_id=user_id,
        action=action,
        resource=resource,
        resource_id=resource_id,
        details=details,
        ip_address=ip_address,
        user_agent=user_agent,
        method=method,
        path=path,
    )

    return crud.create_audit_log(db=db, audit_log=audit_log)


# =====================================================
# Query Audit Logs
# =====================================================

def get_audit_logs(
    db: Session,
    page: int = 1,
    page_size: int = 20,
    search: str | None = None,
    sort_by: str | None = None,
    sort_order: str = "desc",
    user_id: int | None = None,
    action: str | None = None,
    resource: str | None = None,
):
    filters = {}
    if user_id is not None:
        filters["user_id"] = user_id
    if action:
        filters["action"] = action
    if resource:
        filters["resource"] = resource

    return crud.get_audit_logs(
        db=db,
        page=page,
        page_size=page_size,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
        filters=filters if filters else None,
    )


def get_user_activity(db: Session, user_id: int, page: int = 1, page_size: int = 20):
    return crud.get_user_audit_logs(
        db=db,
        user_id=user_id,
        page=page,
        page_size=page_size,
    )


def get_resource_history(
    db: Session,
    resource: str,
    resource_id: int | None = None,
    page: int = 1,
    page_size: int = 20,
):
    return crud.get_resource_audit_logs(
        db=db,
        resource=resource,
        resource_id=resource_id,
        page=page,
        page_size=page_size,
    )


# =====================================================
# Audit Summary
# =====================================================

def get_audit_summary(db: Session) -> schemas.AuditSummary:
    total = crud.get_total_actions(db)
    today = crud.get_actions_today(db)
    top_actions = crud.get_top_actions(db, limit=10)
    top_users = crud.get_top_users(db, limit=10)

    return schemas.AuditSummary(
        total_actions=total,
        actions_today=today,
        top_actions=[
            {"action": a, "count": c} for a, c in top_actions
        ],
        top_users=[
            {"user_id": u, "count": c} for u, c in top_users
        ],
    )
