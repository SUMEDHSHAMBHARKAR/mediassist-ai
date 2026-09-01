import pytest
from tests.conftest import auth_header
from app.audit import models as audit_models


class TestAuditLogs:
    def test_audit_requires_admin(self, client, patient_user, patient_token):
        response = client.get(
            "/audit/logs",
            headers=auth_header(patient_token),
        )
        assert response.status_code == 403

    def test_get_audit_logs(self, client, db, admin_user, admin_token):
        # Create a test audit log
        log = audit_models.AuditLog(
            user_id=admin_user.id,
            action="create",
            resource="patients",
            resource_id=1,
            method="POST",
            path="/patient",
            status_code=200,
        )
        db.add(log)
        db.commit()

        response = client.get(
            "/audit/logs",
            headers=auth_header(admin_token),
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total_records"] >= 1

    def test_get_audit_logs_filter_by_action(self, client, db, admin_user, admin_token):
        log = audit_models.AuditLog(
            user_id=admin_user.id,
            action="delete",
            resource="billing",
            method="DELETE",
            path="/billing/1",
            status_code=200,
        )
        db.add(log)
        db.commit()

        response = client.get(
            "/audit/logs?action=delete",
            headers=auth_header(admin_token),
        )
        assert response.status_code == 200
        data = response.json()
        assert all(item["action"] == "delete" for item in data["items"])


class TestAuditSummary:
    def test_summary_requires_admin(self, client, doctor_user, doctor_token):
        response = client.get(
            "/audit/summary",
            headers=auth_header(doctor_token),
        )
        assert response.status_code == 403

    def test_summary_returns_metrics(self, client, db, admin_user, admin_token):
        for i in range(3):
            log = audit_models.AuditLog(
                user_id=admin_user.id,
                action="create",
                resource="patients",
                method="POST",
                path="/patient",
                status_code=200,
            )
            db.add(log)
        db.commit()

        response = client.get(
            "/audit/summary",
            headers=auth_header(admin_token),
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total_actions"] >= 3
        assert "top_actions" in data
        assert "top_users" in data


class TestUserActivity:
    def test_get_user_activity(self, client, db, admin_user, admin_token):
        log = audit_models.AuditLog(
            user_id=admin_user.id,
            action="login",
            resource="auth",
            method="POST",
            path="/auth/login",
            status_code=200,
        )
        db.add(log)
        db.commit()

        response = client.get(
            f"/audit/user/{admin_user.id}",
            headers=auth_header(admin_token),
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total_records"] >= 1
