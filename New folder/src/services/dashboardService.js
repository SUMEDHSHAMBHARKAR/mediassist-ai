import { ROLES } from "../constants/roles";
import {
  activityFeed,
  adminDashboard,
  doctorDashboard,
  patientDashboard,
} from "../mock/dashboard";
import { resolve } from "./mockTransport";

/**
 * Dashboard service.
 *
 *   forRole    -> GET /dashboard/doctor | /dashboard/patient | /dashboard/admin
 *   overview   -> GET /dashboard/overview
 *   revenue    -> GET /dashboard/revenue
 *   activity   -> (composed from the audit domain)
 */
const BY_ROLE = {
  [ROLES.ADMIN]: adminDashboard,
  [ROLES.DOCTOR]: doctorDashboard,
  [ROLES.PATIENT]: patientDashboard,
  admin: adminDashboard,
  doctor: doctorDashboard,
  patient: patientDashboard,
};

export const dashboardService = {
  forRole(role) {
    return resolve(BY_ROLE[role] || adminDashboard, { delay: 320 });
  },

  overview() {
    return resolve(
      {
        total_patients: 1248,
        total_doctors: 48,
        total_appointments: 3410,
        today_appointments: 24,
        pending_bills: 18,
        paid_bills: 290,
        revenue: 485000,
        unread_notifications: 4,
        medical_records: 1820,
        reports_uploaded: 940,
        prescriptions_created: 1450,
        ...adminDashboard,
      },
      { delay: 320 },
    );
  },

  revenue(period = "monthly") {
    return resolve(
      {
        total_revenue: adminDashboard.stats?.revenueMonth?.value || 485000,
        period,
        chart: {
          labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
          values: [68000, 74000, 81000, 79000, 89000, 94000],
        },
        average_revenue: 80833.33,
        growth_percentage: 5.6,
        series: adminDashboard.revenueSeries,
        byMethod: adminDashboard.revenueByMethod,
        total: adminDashboard.stats?.revenueMonth?.value || 485000,
      },
      { delay: 300 },
    );
  },

  appointments() {
    return resolve(
      {
        total_appointments: 3410,
        status_breakdown: { completed: 2800, cancelled: 110, scheduled: 500 },
        appointments_per_day: { labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], values: [42, 58, 61, 55, 49, 30, 12] },
        appointments_by_department: [
          { label: "Cardiology", value: 840, percentage: 24.6 },
          { label: "Neurology", value: 620, percentage: 18.2 },
          { label: "Paediatrics", value: 550, percentage: 16.1 },
        ],
      },
      { delay: 280 },
    );
  },

  doctors() {
    return resolve(
      {
        total_doctors: 48,
        active_doctors: 44,
        top_doctors: [
          { doctor_id: 1, name: "Dr. Ananya Rao", department: "Cardiology", total_appointments: 310, revenue_generated: 142000, average_consultation: 1200 },
          { doctor_id: 2, name: "Dr. Sameer Ghosh", department: "Neurology", total_appointments: 280, revenue_generated: 135000, average_consultation: 1500 },
        ],
      },
      { delay: 280 },
    );
  },

  patients() {
    return resolve(
      {
        total_patients: 1248,
        new_patients_this_month: 84,
        gender_distribution: [
          { label: "Female", value: 680, percentage: 54.5 },
          { label: "Male", value: 540, percentage: 43.3 },
          { label: "Other", value: 28, percentage: 2.2 },
        ],
        age_groups: [
          { group: "0-18", count: 180, percentage: 14.4 },
          { group: "19-45", count: 520, percentage: 41.7 },
          { group: "46-65", count: 380, percentage: 30.4 },
          { group: "65+", count: 168, percentage: 13.5 },
        ],
        most_active_patients: [],
      },
      { delay: 280 },
    );
  },

  reports() {
    return resolve(
      {
        total_reports: 940,
        report_types: [
          { label: "Blood Report", value: 380, percentage: 40.4 },
          { label: "Imaging", value: 240, percentage: 25.5 },
          { label: "ECG", value: 160, percentage: 17.0 },
        ],
        monthly_uploads: { labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"], values: [120, 140, 155, 160, 175, 190] },
      },
      { delay: 280 },
    );
  },

  prescriptions() {
    return resolve(
      {
        total_prescriptions: 1450,
        most_prescribed_medicines: [
          { medicine_name: "Amlodipine", count: 320 },
          { medicine_name: "Metformin", count: 290 },
          { medicine_name: "Paracetamol", count: 260 },
        ],
        average_prescriptions_per_day: 18.5,
        monthly_prescriptions: { labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"], values: [210, 230, 245, 250, 255, 260] },
      },
      { delay: 280 },
    );
  },

  billing() {
    return resolve(
      {
        total_bills: 320,
        pending_bills: 18,
        paid_bills: 290,
        cancelled_bills: 12,
        total_revenue: 485000,
        outstanding_payments: 42000,
        average_bill_amount: 1515.62,
        revenue_chart: { labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"], values: [68000, 74000, 81000, 79000, 89000, 94000] },
      },
      { delay: 280 },
    );
  },

  activity(limit) {
    return resolve(limit ? activityFeed.slice(0, limit) : activityFeed, { delay: 240 });
  },
};

export default dashboardService;
