/**
 * Status vocabularies and their visual tone.
 *
 * Tone is the only thing that decides a badge's colour, so severity is
 * consistent across appointments, invoices, reports and records. Values match
 * the strings the backend uses.
 */

/* ---------------------------------------------------------- appointments */

export const APPOINTMENT_STATUS = {
  SCHEDULED: "Scheduled",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const APPOINTMENT_STATUS_META = {
  [APPOINTMENT_STATUS.SCHEDULED]: { label: "Scheduled", tone: "accent" },
  [APPOINTMENT_STATUS.COMPLETED]: { label: "Completed", tone: "success" },
  [APPOINTMENT_STATUS.CANCELLED]: { label: "Cancelled", tone: "critical" },
  // Fallbacks for legacy/UI status badges
  scheduled: { label: "Scheduled", tone: "accent" },
  completed: { label: "Completed", tone: "success" },
  cancelled: { label: "Cancelled", tone: "critical" },
};

/** Statuses that still occupy a slot in the schedule. */
export const ACTIVE_APPOINTMENT_STATUSES = [
  APPOINTMENT_STATUS.SCHEDULED,
  "scheduled",
];

export const APPOINTMENT_TYPES = [
  { value: "consultation", label: "Consultation" },
  { value: "follow_up", label: "Follow-up" },
  { value: "procedure", label: "Procedure" },
  { value: "diagnostic", label: "Diagnostic" },
  { value: "teleconsult", label: "Teleconsult" },
];

/* -------------------------------------------------------------- billing */

export const PAYMENT_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  CANCELLED: "cancelled",
};

export const PAYMENT_STATUS_META = {
  [PAYMENT_STATUS.PAID]: { label: "Paid", tone: "success" },
  [PAYMENT_STATUS.PENDING]: { label: "Pending", tone: "warning" },
  [PAYMENT_STATUS.CANCELLED]: { label: "Cancelled", tone: "muted" },
  // Legacy aliases
  paid: { label: "Paid", tone: "success" },
  pending: { label: "Pending", tone: "warning" },
  cancelled: { label: "Cancelled", tone: "muted" },
};

export const PAYMENT_METHODS = [
  { value: "card", label: "Card" },
  { value: "upi", label: "UPI" },
  { value: "cash", label: "Cash" },
  { value: "insurance", label: "Insurance" },
  { value: "bank_transfer", label: "Bank transfer" },
];

/* -------------------------------------------------------------- reports */

export const REPORT_STATUS = {
  UPLOADED: "Uploaded",
  VERIFIED: "Verified",
  ARCHIVED: "Archived",
};

export const REPORT_STATUS_META = {
  [REPORT_STATUS.UPLOADED]: { label: "Uploaded", tone: "accent" },
  [REPORT_STATUS.VERIFIED]: { label: "Verified", tone: "success" },
  [REPORT_STATUS.ARCHIVED]: { label: "Archived", tone: "muted" },
  // Legacy aliases
  ready: { label: "Ready", tone: "success" },
  processing: { label: "Processing", tone: "warning" },
  uploading: { label: "Uploading", tone: "accent" },
  failed: { label: "Failed", tone: "critical" },
  archived: { label: "Archived", tone: "muted" },
};

export const REPORT_TYPES = [
  { value: "Blood Report", label: "Blood Report" },
  { value: "MRI", label: "MRI" },
  { value: "CT Scan", label: "CT Scan" },
  { value: "X-Ray", label: "X-Ray" },
  { value: "ECG", label: "ECG" },
  { value: "Prescription", label: "Prescription" },
  { value: "Other", label: "Other" },
];

/* ------------------------------------------------------ clinical severity */

export const SEVERITY = {
  ROUTINE: "routine",
  MODERATE: "moderate",
  URGENT: "urgent",
  CRITICAL: "critical",
};

export const SEVERITY_META = {
  [SEVERITY.ROUTINE]: { label: "Routine", tone: "muted" },
  [SEVERITY.MODERATE]: { label: "Moderate", tone: "accent" },
  [SEVERITY.URGENT]: { label: "Urgent", tone: "warning" },
  [SEVERITY.CRITICAL]: { label: "Critical", tone: "critical" },
};

/* ------------------------------------------------------------ prescriptions */

export const RX_STATUS = {
  ACTIVE: "active",
  COMPLETED: "completed",
  DISCONTINUED: "discontinued",
};

export const RX_STATUS_META = {
  [RX_STATUS.ACTIVE]: { label: "Active", tone: "success" },
  [RX_STATUS.COMPLETED]: { label: "Completed", tone: "muted" },
  [RX_STATUS.DISCONTINUED]: { label: "Discontinued", tone: "critical" },
};

export const DOSAGE_FREQUENCIES = [
  { value: "once_daily", label: "Once daily (OD)" },
  { value: "twice_daily", label: "Twice daily (BD)" },
  { value: "thrice_daily", label: "Three times daily (TDS)" },
  { value: "four_times_daily", label: "Four times daily (QDS)" },
  { value: "as_needed", label: "As needed (PRN)" },
  { value: "weekly", label: "Weekly" },
];

export const DOSAGE_ROUTES = [
  { value: "oral", label: "Oral" },
  { value: "topical", label: "Topical" },
  { value: "intravenous", label: "Intravenous" },
  { value: "intramuscular", label: "Intramuscular" },
  { value: "subcutaneous", label: "Subcutaneous" },
  { value: "inhalation", label: "Inhalation" },
  { value: "ophthalmic", label: "Ophthalmic" },
];

/* -------------------------------------------------------------- patients */

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export const GENDERS = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "other", label: "Other" },
  { value: "undisclosed", label: "Prefer not to say" },
];

export const PATIENT_STATUS = {
  ACTIVE: "active",
  ADMITTED: "admitted",
  DISCHARGED: "discharged",
  INACTIVE: "inactive",
};

export const PATIENT_STATUS_META = {
  [PATIENT_STATUS.ACTIVE]: { label: "Outpatient", tone: "success" },
  [PATIENT_STATUS.ADMITTED]: { label: "Admitted", tone: "warning" },
  [PATIENT_STATUS.DISCHARGED]: { label: "Discharged", tone: "muted" },
  [PATIENT_STATUS.INACTIVE]: { label: "Inactive", tone: "muted" },
};

/* --------------------------------------------------------- notifications */

export const NOTIFICATION_TYPES = {
  APPOINTMENT: "appointment",
  REPORT: "report",
  PRESCRIPTION: "prescription",
  BILLING: "billing",
  SYSTEM: "system",
  AI: "ai",
};

export const NOTIFICATION_META = {
  [NOTIFICATION_TYPES.APPOINTMENT]: { icon: "appointments", tone: "accent" },
  [NOTIFICATION_TYPES.REPORT]: { icon: "reports", tone: "success" },
  [NOTIFICATION_TYPES.PRESCRIPTION]: { icon: "prescriptions", tone: "accent" },
  [NOTIFICATION_TYPES.BILLING]: { icon: "billing", tone: "warning" },
  [NOTIFICATION_TYPES.SYSTEM]: { icon: "info", tone: "muted" },
  [NOTIFICATION_TYPES.AI]: { icon: "ai", tone: "accent" },
};

/**
 * Resolve a status string to its display meta, with a readable fallback so an
 * unexpected backend value never renders a blank badge.
 */
export function statusMeta(map, value) {
  return (
    map[value] || {
      label: String(value || "Unknown").replace(/[_-]+/g, " "),
      tone: "muted",
    }
  );
}

/** Build Select options from a status meta map. */
export function statusOptions(map) {
  return Object.entries(map).map(([value, meta]) => ({
    value,
    label: meta.label,
  }));
}

/**
 * Look up a label in an option list ([{ value, label }]).
 * Falls back to a humanised form of the raw value so an unmapped backend value
 * is still readable rather than blank.
 */
export function optionLabel(options, value) {
  const match = options.find((option) => option.value === value);
  if (match) return match.label;

  const text = String(value || "").replace(/[_-]+/g, " ").trim();
  return text ? text[0].toUpperCase() + text.slice(1) : "—";
}
