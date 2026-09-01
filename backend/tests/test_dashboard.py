import pytest
from tests.conftest import auth_header


class TestDashboardOverview:
    def test_overview_requires_auth(self, client):
        response = client.get("/dashboard/overview")
        assert response.status_code == 401

    def test_overview_returns_metrics(self, client, admin_user, admin_token):
        response = client.get(
            "/dashboard/overview",
            headers=auth_header(admin_token),
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_patients" in data
        assert "total_doctors" in data
        assert "total_appointments" in data
        assert "revenue" in data
        assert "prescriptions_created" in data


class TestRevenueAnalytics:
    def test_revenue_requires_auth(self, client):
        response = client.get("/dashboard/revenue")
        assert response.status_code == 401

    def test_revenue_default_period(self, client, admin_user, admin_token):
        response = client.get(
            "/dashboard/revenue",
            headers=auth_header(admin_token),
        )
        assert response.status_code == 200
        data = response.json()
        assert data["period"] == "monthly"
        assert "chart" in data
        assert "total_revenue" in data

    def test_revenue_daily_period(self, client, admin_user, admin_token):
        response = client.get(
            "/dashboard/revenue?period=daily",
            headers=auth_header(admin_token),
        )
        assert response.status_code == 200
        assert response.json()["period"] == "daily"

    def test_revenue_invalid_period(self, client, admin_user, admin_token):
        response = client.get(
            "/dashboard/revenue?period=invalid",
            headers=auth_header(admin_token),
        )
        assert response.status_code == 422


class TestAppointmentAnalytics:
    def test_appointment_analytics(self, client, admin_user, admin_token):
        response = client.get(
            "/dashboard/appointments",
            headers=auth_header(admin_token),
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_appointments" in data
        assert "status_breakdown" in data
        assert "appointments_per_day" in data


class TestDoctorAnalytics:
    def test_doctor_analytics(self, client, admin_user, admin_token):
        response = client.get(
            "/dashboard/doctors",
            headers=auth_header(admin_token),
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_doctors" in data
        assert "active_doctors" in data
        assert "top_doctors" in data


class TestBillingAnalytics:
    def test_billing_analytics(self, client, admin_user, admin_token):
        response = client.get(
            "/dashboard/billing",
            headers=auth_header(admin_token),
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_bills" in data
        assert "total_revenue" in data
        assert "average_bill_amount" in data
