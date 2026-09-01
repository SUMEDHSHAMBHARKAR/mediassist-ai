from sqlalchemy.orm import Session
from app.notifications import schemas,crud , models
from fastapi import BackgroundTasks , Depends , HTTPException
from app.auth import dependencies ,crud as auth_crud , models as auth_models
from app.email.service import send_email 

IMPORTANT_NOTIFICATION_TYPES = {
    "appointment",
    "billing",
    "payment",
    "prescription"
}

def should_send_email(notification_type : str) -> bool:
    return notification_type in IMPORTANT_NOTIFICATION_TYPES


def create_notification(db : Session , background_tasks : BackgroundTasks , user_id : int,  title: str,message: str, notification_type : str, html_body : str | None = None) -> models.Notification:
    notification_data = schemas.NotificationCreate(
        user_id= user_id,
        title = title,
        message = message,
        notification_type=  notification_type
    )
    notification = crud.create_notification(db = db , notification=notification_data)


    if should_send_email(notification_type):
        user = auth_crud.get_user_by_id(db , user_id)
        if user is None:
            raise HTTPException(
                status_code= 404,
                detail="User not found"
            )
        recipient = user.email
        background_tasks.add_task(
            send_email,
            recipient,
            title,
            html_body if html_body else message
        )

    return notification





