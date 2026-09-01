import { api } from "./apiClient";

/**
 * Dashboard service connected to FastAPI endpoints:
 *   forRole        -> GET /dashboard/doctor | /dashboard/patient | /dashboard/admin
 *   overview       -> GET /dashboard/overview
 *   revenue        -> GET /dashboard/revenue
 *   appointments   -> GET /dashboard/appointments
 *   doctors        -> GET /dashboard/doctors
 *   patients       -> GET /dashboard/patients
 *   reports        -> GET /dashboard/reports
 *   prescriptions  -> GET /dashboard/prescriptions
 *   billing        -> GET /dashboard/billing
 *   activity       -> GET /audit/logs
 */

export const dashboardService = {
  forRole(role = "admin") {
    const routeRole = String(role).toLowerCase();
    const endpoint = routeRole === "doctor" ? "/dashboard/doctor" : routeRole === "patient" ? "/dashboard/patient" : "/dashboard/admin";
    return api.get(endpoint);
  },

  async overview() {
    const [overview, revenue, appointments, patients] = await Promise.all([
      api.get("/dashboard/overview"),
      api.get("/dashboard/revenue", { params: { period: "monthly" } }),
      api.get("/dashboard/appointments"),
      api.get("/dashboard/patients"),
    ]);

    const toSeries = (chart = {}) =>
      (chart.labels || []).map((label, index) => ({
        label,
        value: chart.values?.[index] ?? 0,
      }));
    const outcomes = appointments?.status_breakdown || {};

    // The dashboard components use a presentation-oriented aggregate while the
    // FastAPI service exposes focused analytics endpoints. Keep that mapping
    // here so UI code never has to know the HTTP response shapes.
    return {
      stats: {
        activePatients: { value: overview?.total_patients ?? 0, delta: 0 },
        appointmentsToday: { value: overview?.today_appointments ?? 0, delta: 0 },
        occupancyRate: { value: 0, delta: 0 },
        revenueMonth: { value: revenue?.total_revenue ?? 0, delta: revenue?.growth_percentage ?? 0 },
        pendingInvoices: { value: overview?.pending_bills ?? 0, delta: 0 },
        avgWaitMinutes: { value: 0, delta: 0 },
      },
      revenueSeries: toSeries(revenue?.chart),
      weeklyLoad: toSeries(appointments?.appointments_per_day),
      appointmentsSeries: toSeries(appointments?.appointments_per_day),
      departmentLoad: (appointments?.appointments_by_department || []).map((item) => ({
        label: item.label,
        value: item.value,
      })),
      appointmentOutcome: [
        { label: "Completed", value: outcomes.completed ?? 0, color: "var(--success)" },
        { label: "Scheduled", value: outcomes.scheduled ?? 0, color: "var(--accent)" },
        { label: "Cancelled", value: outcomes.cancelled ?? 0, color: "var(--critical)" },
      ],
      patientAnalytics: patients,
    };
  },

  revenue(period = "monthly") {
    return api.get("/dashboard/revenue", { params: { period } });
  },

  appointments() {
    return api.get("/dashboard/appointments");
  },

  doctors() {
    return api.get("/dashboard/doctors");
  },

  patients() {
    return api.get("/dashboard/patients");
  },

  reports() {
    return api.get("/dashboard/reports");
  },

  prescriptions() {
    return api.get("/dashboard/prescriptions");
  },

  billing() {
    return api.get("/dashboard/billing");
  },

  async activity(limit = 10) {
    try {
      const res = await api.get("/audit/logs", { params: { page_size: limit } });
      return res?.items || (Array.isArray(res) ? res : []);
    } catch (err) {
      return [];
    }
  },
};

export default dashboardService;
