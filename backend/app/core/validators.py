from datetime import date
from fastapi import HTTPException, status


# =====================================================
# Shared Validators
# =====================================================

def validate_date_not_future(value: date, field_name: str = "Date") -> date:
    if value > date.today():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"{field_name} cannot be in the future",
        )
    return value


def validate_date_not_past(value: date, field_name: str = "Date") -> date:
    if value < date.today():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"{field_name} cannot be in the past",
        )
    return value


def validate_positive_integer(value: int, field_name: str = "Value") -> int:
    if value < 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"{field_name} must be a positive integer",
        )
    return value


def validate_non_empty_string(value: str | None, field_name: str = "Field") -> str:
    if value is None or value.strip() == "":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"{field_name} cannot be empty",
        )
    return value.strip()


def validate_id_exists(obj, resource_name: str = "Resource", resource_id: int | None = None):
    if obj is None:
        detail = f"{resource_name} not found"
        if resource_id is not None:
            detail = f"{resource_name} with id {resource_id} not found"
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail,
        )
    return obj
