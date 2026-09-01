from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import dependencies, models as auth_models
from app.audit import service, schemas

router = APIRouter(
    prefix="/audit",
    tags=["Audit"],
)


# =====================================================
# Get Audit Logs (Admin only)
# =====================================================

@router.get("/logs")
def get_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    sort_by: str | None = None,
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    user_id: int | None = None,
    action: str | None = None,
    resource: str | None = None,
    db: Session = Depends(get_db),
    current_user: auth_models.User = Depends(dependencies.get_current_admin),
):
    return service.get_audit_logs(
        db=db,
        page=page,
        page_size=page_size,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
        user_id=user_id,
        action=action,
        resource=resource,
    )


# =====================================================
# Get User Activity
# =====================================================

@router.get("/user/{user_id}")
def get_user_activity(
    user_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: auth_models.User = Depends(dependencies.get_current_admin),
):
    return service.get_user_activity(
        db=db,
        user_id=user_id,
        page=page,
        page_size=page_size,
    )


# =====================================================
# Get Resource History
# =====================================================

@router.get("/resource/{resource}")
def get_resource_history(
    resource: str,
    resource_id: int | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: auth_models.User = Depends(dependencies.get_current_admin),
):
    return service.get_resource_history(
        db=db,
        resource=resource,
        resource_id=resource_id,
        page=page,
        page_size=page_size,
    )


# =====================================================
# Audit Summary
# =====================================================

@router.get("/summary", response_model=schemas.AuditSummary)
def get_audit_summary(
    db: Session = Depends(get_db),
    current_user: auth_models.User = Depends(dependencies.get_current_admin),
):
    return service.get_audit_summary(db=db)
