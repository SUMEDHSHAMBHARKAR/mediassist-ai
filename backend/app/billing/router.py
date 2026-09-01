from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.billing import crud, schemas, models
from app.auth import dependencies, models as auth_models, authorization
from app import models as main_models

router = APIRouter(
    tags=["Billing"]
)


@router.post("/billing", response_model=schemas.BillingResponse)
def create_billing(billing: schemas.BillingCreate, db: Session = Depends(get_db), current_user: auth_models.User = Depends(dependencies.get_current_user)):
    if current_user.role not in ["doctor", "admin"]:
        raise HTTPException(
            status_code=403,
            detail="Not authorized"
        )

    return crud.create_billing(db, billing)

@router.get("/billing/patient/{patient_id}")
def get_patient_billings(
    patient_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    sort_by: str | None = None,
    sort_order: str = Query("asc", pattern="^(asc|desc)$"),
    payment_status: str | None = None,
    db: Session = Depends(get_db),
    current_user: auth_models.User = Depends(dependencies.get_current_user),
):
    if current_user.role == "patient":
        if current_user.patient.id != patient_id:
            raise HTTPException(
                status_code=404, detail=" Not Authorized"
            )

    filters = {}
    if payment_status:
        filters["payment_status"] = payment_status

    return crud.get_patient_billings(
        db=db,
        patient_id=patient_id,
        page=page,
        page_size=page_size,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
        filters=filters,
    )

@router.get("/billing/{billing_id}" , response_model=schemas.BillingResponse)
def get_billing(billing_id : int ,db: Session = Depends(get_db),current_user: auth_models.User = Depends(dependencies.get_current_user)):
    billing = crud.get_billing(db , billing_id)
    authorization.authorize_billing_access(current_user , billing)
    return crud.get_billing(db , billing_id)


@router.patch("/billing/{billing_id}" , response_model=schemas.BillingResponse)
def update_billing(updated_billing : schemas.BillingUpdate ,billing_id : int ,db: Session = Depends(get_db),  current_doctor: auth_models.User = Depends(dependencies.get_current_doctor)):
    return crud.update_billing(db , billing_id ,updated_billing)

@router.delete("/billing/{billing_id}")
def delete_billing(billing_id : int ,db: Session = Depends(get_db),  current_admin: auth_models.User = Depends(dependencies.get_current_admin)):
    return crud.delete_billing(db , billing_id)