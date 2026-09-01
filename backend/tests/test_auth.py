import pytest
from tests.conftest import auth_header


class TestRegister:
    def test_register_success(self, client):
        response = client.post("/auth/register", json={
            "user_name": "newuser",
            "email": "newuser@test.com",
            "password": "Test@1234",
        })
        assert response.status_code == 200
        data = response.json()
        assert data["user_name"] == "newuser"
        assert data["email"] == "newuser@test.com"
        assert data["role"] == "Patient"

    def test_register_duplicate_username(self, client):
        client.post("/auth/register", json={
            "user_name": "dupuser",
            "email": "dup1@test.com",
            "password": "Test@1234",
        })
        response = client.post("/auth/register", json={
            "user_name": "dupuser",
            "email": "dup2@test.com",
            "password": "Test@1234",
        })
        assert response.status_code == 409

    def test_register_duplicate_email(self, client):
        client.post("/auth/register", json={
            "user_name": "user1",
            "email": "same@test.com",
            "password": "Test@1234",
        })
        response = client.post("/auth/register", json={
            "user_name": "user2",
            "email": "same@test.com",
            "password": "Test@1234",
        })
        assert response.status_code == 409


class TestLogin:
    def test_login_success(self, client):
        client.post("/auth/register", json={
            "user_name": "loginuser",
            "email": "login@test.com",
            "password": "Test@1234",
        })
        response = client.post("/auth/login", data={
            "username": "loginuser",
            "password": "Test@1234",
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    def test_login_invalid_password(self, client):
        client.post("/auth/register", json={
            "user_name": "loginuser2",
            "email": "login2@test.com",
            "password": "Test@1234",
        })
        response = client.post("/auth/login", data={
            "username": "loginuser2",
            "password": "WrongPass@1",
        })
        assert response.status_code == 401

    def test_login_nonexistent_user(self, client):
        response = client.post("/auth/login", data={
            "username": "nonexistent",
            "password": "Test@1234",
        })
        assert response.status_code == 401


class TestRefreshToken:
    def test_refresh_success(self, client):
        client.post("/auth/register", json={
            "user_name": "refreshuser",
            "email": "refresh@test.com",
            "password": "Test@1234",
        })
        login_response = client.post("/auth/login", data={
            "username": "refreshuser",
            "password": "Test@1234",
        })
        refresh_token = login_response.json()["refresh_token"]

        response = client.post("/auth/refresh", json={
            "refresh_token": refresh_token,
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data

    def test_refresh_invalid_token(self, client):
        response = client.post("/auth/refresh", json={
            "refresh_token": "invalid.token.here",
        })
        assert response.status_code == 401


class TestMe:
    def test_get_me_success(self, client, admin_user, admin_token):
        response = client.get("/auth/me", headers=auth_header(admin_token))
        assert response.status_code == 200
        data = response.json()
        assert data["user_name"] == "admin_test"
        assert data["role"] == "Admin"

    def test_get_me_unauthorized(self, client):
        response = client.get("/auth/me")
        assert response.status_code == 401

    def test_get_me_invalid_token(self, client):
        response = client.get("/auth/me", headers=auth_header("bad.token"))
        assert response.status_code == 401
