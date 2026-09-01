from sqlalchemy.orm import Session
from app.notifications import models, schemas
from app.core.query_builder import build_query

NOTIFICATION_SEARCH_FIELDS = ["title", "message"]


def create_notification(db: Session, notification: schemas.NotificationCreate):
    db_notification = models.Notification(**notification.model_dump())

    db.add(db_notification)
    db.commit()
    db.refresh(db_notification)

    return db_notification


def get_notifications_by_user(
    db: Session,
    user_id: int,
    page: int = 1,
    page_size: int = 20,
    search: str | None = None,
    sort_by: str | None = None,
    sort_order: str = "asc",
    filters: dict | None = None,
):
    base_query = (
        db.query(models.Notification)
        .filter(models.Notification.user_id == user_id)
    )

    return build_query(
        db=db,
        model=models.Notification,
        filters=filters,
        search=search,
        search_fields=NOTIFICATION_SEARCH_FIELDS,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
        base_query=base_query,
    )


def mark_as_read(db: Session,notification_id: int):
    notification = db.query(models.Notification).filter(models.Notification.id == notification_id).first()
    

    if notification:
        notification.is_read = True
        db.commit()
        db.refresh(notification)

    return notification