/**
 * Roles mirror the backend's user roles. Kept as constants so no component
 * compares raw strings.
 */
export const ROLES = {
  PATIENT: "Patient",
  DOCTOR: "Doctor",
  ADMIN: "Admin",
};

export const ROLE_LABELS = {
  [ROLES.PATIENT]: "Patient",
  [ROLES.DOCTOR]: "Clinician",
  [ROLES.ADMIN]: "Administrator",
};

export const ROLE_ICONS = {
  [ROLES.PATIENT]: "user",
  [ROLES.DOCTOR]: "doctors",
  [ROLES.ADMIN]: "shieldCheck",
};

export const ROLE_OPTIONS = Object.values(ROLES).map((value) => ({
  value,
  label: ROLE_LABELS[value],
}));

/** Landing route after sign-in. All roles share the dashboard shell. */
export const ROLE_HOME = {
  [ROLES.PATIENT]: "/dashboard",
  [ROLES.DOCTOR]: "/dashboard",
  [ROLES.ADMIN]: "/dashboard",
};

/** Standardize any raw role string to its exact backend capitalization. */
export function normalizeRole(role) {
  if (!role) return ROLES.DOCTOR;
  const str = String(role).trim().toLowerCase();
  if (str === "admin") return ROLES.ADMIN;
  if (str === "patient") return ROLES.PATIENT;
  if (str === "doctor") return ROLES.DOCTOR;
  return role;
}

