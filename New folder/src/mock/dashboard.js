import { recentDayLabels, recentMonthLabels } from "./time";

/**
 * Dashboard aggregates — shaped like GET /dashboard/{role} and the
 * /dashboard/{metric} endpoints.
 *
 * Series carry labels generated relative to today so axes never read as stale.
 */

const monthLabels = recentMonthLabels(6);
const dayLabels = recentDayLabels(7);

export const adminDashboard = {
  stats: {
    activePatients: { value: 1284, delta: 6.4 },
    appointmentsToday: { value: 68, delta: -3.1 },
    occupancyRate: { value: 82, delta: 4.2 },
    revenueMonth: { value: 4_218_500, delta: 11.8 },
    pendingInvoices: { value: 37, delta: -8.5 },
    avgWaitMinutes: { value: 14, delta: -12.0 },
  },
  appointmentsSeries: monthLabels.map((label, index) => ({
    label,
    value: [980, 1042, 1130, 1088, 1204, 1276][index],
  })),
  revenueSeries: monthLabels.map((label, index) => ({
    label,
    value: [3_120_000, 3_405_000, 3_780_000, 3_640_000, 3_920_000, 4_218_500][index],
  })),
  weeklyLoad: dayLabels.map((label, index) => ({
    label,
    value: [58, 72, 66, 81, 76, 44, 21][index],
  })),
  departmentLoad: [
    { label: "General Medicine", value: 264 },
    { label: "Cardiology", value: 198 },
    { label: "Paediatrics", value: 176 },
    { label: "Orthopaedics", value: 142 },
    { label: "Neurology", value: 118 },
    { label: "Endocrinology", value: 96 },
    { label: "Pulmonology", value: 84 },
  ],
  appointmentOutcome: [
    { label: "Completed", value: 812, color: "var(--success)" },
    { label: "Scheduled", value: 296, color: "var(--accent)" },
    { label: "Cancelled", value: 118, color: "var(--critical)" },
    { label: "No show", value: 50, color: "var(--muted)" },
  ],
  revenueByMethod: [
    { label: "Insurance", value: 2_140_000 },
    { label: "Card", value: 968_000 },
    { label: "UPI", value: 742_500 },
    { label: "Cash", value: 368_000 },
  ],
};

export const doctorDashboard = {
  stats: {
    appointmentsToday: { value: 9, delta: 12.5 },
    patientsUnderCare: { value: 148, delta: 3.4 },
    pendingReports: { value: 6, delta: -14.0 },
    prescriptionsWeek: { value: 24, delta: 8.0 },
  },
  weeklyConsults: dayLabels.map((label, index) => ({
    label,
    value: [8, 11, 9, 12, 10, 5, 2][index],
  })),
  outcomeSplit: [
    { label: "Completed", value: 186, color: "var(--success)" },
    { label: "Follow-up due", value: 42, color: "var(--warning)" },
    { label: "Cancelled", value: 14, color: "var(--critical)" },
  ],
  caseMix: [
    { label: "Hypertension", value: 38 },
    { label: "Ischaemic heart disease", value: 29 },
    { label: "Arrhythmia", value: 21 },
    { label: "Heart failure", value: 16 },
    { label: "Valvular disease", value: 11 },
  ],
};

export const patientDashboard = {
  stats: {
    upcomingAppointments: { value: 1 },
    activePrescriptions: { value: 1 },
    reportsAvailable: { value: 2 },
    outstandingBalance: { value: 5723 },
  },
  vitalsTrend: {
    systolic: monthLabels.map((label, index) => ({
      label,
      value: [138, 141, 144, 142, 147, 148][index],
    })),
    weight: monthLabels.map((label, index) => ({
      label,
      value: [88, 87, 86, 85, 85, 84][index],
    })),
  },
  adherence: 86,
};

/** Recent activity feed — the audit-adjacent stream shown on dashboards. */
export const activityFeed = [
  {
    id: "act-1",
    actor: "Dr. Ananya Rao",
    action: "recorded a diagnosis for",
    target: "Aarav Sharma",
    targetTo: "/patients/pat-001",
    at: "20m ago",
    tone: "accent",
  },
  {
    id: "act-2",
    actor: "Laboratory",
    action: "published a report for",
    target: "Rehan Qadri",
    targetTo: "/patients/pat-005",
    at: "1h ago",
    tone: "success",
  },
  {
    id: "act-3",
    actor: "Dr. Sameer Ghosh",
    action: "adjusted anticoagulation for",
    target: "Rehan Qadri",
    targetTo: "/patients/pat-005",
    at: "2h ago",
    tone: "critical",
  },
  {
    id: "act-4",
    actor: "Reception",
    action: "rescheduled an appointment for",
    target: "Lakshmi Iyer",
    targetTo: "/patients/pat-013",
    at: "5h ago",
  },
  {
    id: "act-5",
    actor: "MediAssist AI",
    action: "summarised 3 reports for",
    target: "Aarav Sharma",
    targetTo: "/patients/pat-001",
    at: "6h ago",
    tone: "accent",
  },
  {
    id: "act-6",
    actor: "Billing",
    action: "issued an invoice for",
    target: "Vivaan Reddy",
    targetTo: "/patients/pat-007",
    at: "Yesterday",
  },
  {
    id: "act-7",
    actor: "Dr. Meera Krishnan",
    action: "completed a consultation with",
    target: "Anaya Dutta",
    targetTo: "/patients/pat-017",
    at: "Yesterday",
    tone: "success",
  },
];
