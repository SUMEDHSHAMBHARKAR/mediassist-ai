from fastapi import HTTPException, status


# =====================================================
# Permission Definitions
# =====================================================

ROLE_PERMISSIONS = {
    "Admin": {
        "patients": ["create", "read", "update", "delete", "list"],
        "doctors": ["create", "read", "update", "delete", "list"],
        "appointments": ["create", "read", "update", "delete", "list"],
        "medical_records": ["create", "read", "update", "delete", "list"],
        "prescriptions": ["create", "read", "update", "delete", "list"],
        "billing": ["create", "read", "update", "delete", "list"],
        "reports": ["create", "read", "update", "delete", "list"],
        "notifications": ["create", "read", "update", "delete", "list"],
        "dashboard": ["read", "admin"],
        "users": ["create", "read", "update", "delete", "list"],
        "audit": ["read", "list"],
    },
    "Doctor": {
        "patients": ["read", "list"],
        "doctors": ["read"],
        "appointments": ["read", "update", "list"],
        "medical_records": ["create", "read", "update", "list"],
        "prescriptions": ["create", "read", "update", "delete", "list"],
        "billing": ["create", "read", "list"],
        "reports": ["read", "list"],
        "notifications": ["read", "list"],
        "dashboard": ["read"],
    },
    "Patient": {
        "patients": ["read"],
        "appointments": ["create", "read", "list"],
        "medical_records": ["read", "list"],
        "prescriptions": ["read", "list"],
        "billing": ["read", "list"],
        "reports": ["read", "list"],
        "notifications": ["read", "list"],
        "dashboard": ["read"],
    },
}


# =====================================================
# Permission Check
# =====================================================

def has_permission(role: str, resource: str, action: str) -> bool:
    role_perms = ROLE_PERMISSIONS.get(role, {})
    resource_perms = role_perms.get(resource, [])
    return action in resource_perms


def require_permission(role: str, resource: str, action: str) -> None:
    if not has_permission(role, resource, action):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permission denied: {action} on {resource}.",
        )


# =====================================================
# Resource Ownership
# =====================================================

def check_resource_ownership(
    user_role: str,
    user_id: int,
    resource_owner_id: int,
    patient_id: int | None = None,
    doctor_id: int | None = None,
) -> None:
    if user_role == "Admin":
        return

    if user_role == "Patient" and patient_id is not None:
        if resource_owner_id != patient_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this resource.",
            )
        return

    if user_role == "Doctor" and doctor_id is not None:
        if resource_owner_id != doctor_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this resource.",
            )
        return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Access denied.",
    )
