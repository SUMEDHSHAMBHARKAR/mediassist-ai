import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.database import Base, get_db
from app.main import app
from app.auth import security, models as auth_models


# =====================================================
# Test Database
# =====================================================

TEST_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)

TestingSessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


@pytest.fixture(scope="function")
def db():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# =====================================================
# User Factories
# =====================================================

@pytest.fixture
def admin_user(db):
    user = auth_models.User(
        user_name="admin_test",
        email="admin@test.com",
        hashed_password=security.hash_password("Admin@1234"),
        role="Admin",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def doctor_user(db):
    user = auth_models.User(
        user_name="doctor_test",
        email="doctor@test.com",
        hashed_password=security.hash_password("Doctor@1234"),
        role="Doctor",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def patient_user(db):
    user = auth_models.User(
        user_name="patient_test",
        email="patient@test.com",
        hashed_password=security.hash_password("Patient@1234"),
        role="Patient",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# =====================================================
# Auth Token Helpers
# =====================================================

@pytest.fixture
def admin_token(admin_user):
    return security.create_access_token({"sub": str(admin_user.id)})


@pytest.fixture
def doctor_token(doctor_user):
    return security.create_access_token({"sub": str(doctor_user.id)})


@pytest.fixture
def patient_token(patient_user):
    return security.create_access_token({"sub": str(patient_user.id)})


def auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}
