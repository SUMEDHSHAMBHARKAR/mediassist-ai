import os
from pwdlib import PasswordHash
import jwt
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "temporary-development-secret")
REFRESH_SECRET_KEY = os.getenv("JWT_REFRESH_SECRET_KEY", "temporary-refresh-secret")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

password_hash = PasswordHash.recommended()


def hash_password(password: str):
    return password_hash.hash(password)


def verify_password(password: str, hashed_password):
    return password_hash.verify(password, hashed_password)


def create_access_token(data: dict) -> str:
    data_copy = data.copy()
    expir_time = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    data_copy["exp"] = expir_time
    data_copy["type"] = "access"

    access_token = jwt.encode(
        data_copy,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )
    return access_token


def create_refresh_token(data: dict) -> str:
    data_copy = data.copy()
    expir_time = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    data_copy["exp"] = expir_time
    data_copy["type"] = "refresh"

    refresh_token = jwt.encode(
        data_copy,
        REFRESH_SECRET_KEY,
        algorithm=ALGORITHM,
    )
    return refresh_token


def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )
        if payload.get("type") != "access":
            raise HTTPException(
                status_code=401,
                detail="Invalid token type",
            )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail="Access token has expired",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired access token",
        )


def decode_refresh_token(token: str) -> dict:
    try:
        payload = jwt.decode(
            token,
            REFRESH_SECRET_KEY,
            algorithms=[ALGORITHM],
        )
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=401,
                detail="Invalid token type",
            )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail="Refresh token has expired",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail="Invalid refresh token",
        )
