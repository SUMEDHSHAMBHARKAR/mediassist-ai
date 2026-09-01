from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.notifications import crud, schemas, service
from fastapi import BackgroundTasks

router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"]
)


@router.post("/", response_model=schemas.NotificationResponse)
def create_notification(notification: schemas.NotificationCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    return service.create_notification(
        db=db,
        background_tasks=background_tasks,
        user_id=notification.user_id,
        title=notification.title,
        message=notification.message,
        notification_type=notification.notification_type,
    )


@router.get("/user/{user_id}")
def get_notifications(
    user_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    sort_by: str | None = None,
    sort_order: str = Query("asc", pattern="^(asc|desc)$"),
    is_read: bool | None = None,
    notification_type: str | None = None,
    db: Session = Depends(get_db),
):
    filters = {}
    if is_read is not None:
        filters["is_read"] = is_read
    if notification_type:
        filters["notification_type"] = notification_type

    return crud.get_notifications_by_user(
        db=db,
        user_id=user_id,
        page=page,
        page_size=page_size,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
        filters=filters,
    )


@router.patch("/{notification_id}/read", response_model=schemas.NotificationResponse)
def mark_notification_as_read(notification_id: int, db: Session = Depends(get_db)):
    return crud.mark_as_read(db, notification_id)




