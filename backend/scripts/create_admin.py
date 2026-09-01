from app.database import SessionLocal
from app.auth import models , security , schemas ,crud
from sqlalchemy.orm import Session

def create_admin():
    db: Session = SessionLocal()
    try:
        user_name = input("Enter username: ")
        email = input("Enter email: ")
        password = input("Enter password: ")

        db_user = crud.create_user_with_role(
            db=db,
            user_name=user_name,
            email=email,
            password=password,
            role=schemas.UserRole.admin
        )

        db.commit()
        db.refresh(db_user)

        print("\nAdmin created successfully!")
        print(f"ID: {db_user.id}")
        print(f"Username: {db_user.user_name}")
        print(f"Role: {db_user.role}")
        print(f"Password: {password}")

    finally:
        db.close()

if __name__ == "__main__":
    create_admin()

    