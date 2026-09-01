import { ROLES } from "../constants/roles";
import { doctorsById } from "../mock/doctors";
import { CURRENT_PATIENT_ID, patientsById } from "../mock/patients";
import { resolve } from "./mockTransport";

/**
 * Auth service.
 *
 *   login    -> POST /auth/login
 *   register -> POST /auth/register
 *   refresh  -> POST /auth/refresh
 *   me       -> GET  /auth/me
 *
 * No real authentication happens here and no credentials are validated. The
 * service returns a session for whichever role the demo selects so the role-aware
 * UI can be reviewed. Token storage, refresh and route guarding are deliberately
 * left for the backend integration.
 */

const DEMO_SESSIONS = {
  [ROLES.DOCTOR]: {
    id: 1,
    user_name: "ananya_rao",
    name: doctorsById["doc-001"]?.name || "Dr. Ananya Rao",
    email: doctorsById["doc-001"]?.email || "ananya.rao@mediassist.health",
    role: ROLES.DOCTOR,
    is_active: true,
    patient_profile_exists: false,
    doctor_profile_exists: true,
    doctorId: "doc-001",
    patientId: null,
    department: doctorsById["doc-001"]?.department || "cardiology",
  },
  [ROLES.PATIENT]: {
    id: 5,
    user_name: "aarav_sharma",
    name: patientsById[CURRENT_PATIENT_ID]?.name || "Aarav Sharma",
    email: patientsById[CURRENT_PATIENT_ID]?.email || "aarav.sharma@example.com",
    role: ROLES.PATIENT,
    is_active: true,
    patient_profile_exists: true,
    doctor_profile_exists: false,
    doctorId: null,
    patientId: CURRENT_PATIENT_ID,
    department: null,
  },
  [ROLES.ADMIN]: {
    id: 3,
    user_name: "priyanka_shetty",
    name: "Priyanka Shetty",
    email: "priyanka.shetty@mediassist.health",
    role: ROLES.ADMIN,
    is_active: true,
    patient_profile_exists: false,
    doctor_profile_exists: false,
    doctorId: null,
    patientId: null,
    department: null,
  },
};

export const authService = {
  /** Resolves a demo session for the chosen role or credentials object { identifier, password }. */
  login(credentials = {}) {
    const role = credentials.role || (credentials.identifier?.includes("doctor") ? ROLES.DOCTOR : credentials.identifier?.includes("admin") ? ROLES.ADMIN : ROLES.DOCTOR);
    return resolve(DEMO_SESSIONS[role] || DEMO_SESSIONS[ROLES.DOCTOR], { delay: 700 });
  },

  register(payload) {
    const role = payload?.role || ROLES.PATIENT;
    return resolve(
      {
        id: Date.now(),
        user_name: payload?.user_name || payload?.name?.toLowerCase()?.replace(/\s+/g, "_") || "user",
        name: payload?.name || payload?.user_name,
        email: payload?.email,
        role: role,
        is_active: true,
        patient_profile_exists: role === ROLES.PATIENT,
        doctor_profile_exists: role === ROLES.DOCTOR,
        ...(DEMO_SESSIONS[role] || {}),
      },
      { delay: 900 },
    );
  },

  refresh({ refresh_token } = {}) {
    return resolve(
      {
        access_token: "mock_access_token_" + Date.now(),
        refresh_token: refresh_token || "mock_refresh_token",
        token_type: "bearer",
      },
      { delay: 300 },
    );
  },

  me(role) {
    return resolve(DEMO_SESSIONS[role] || DEMO_SESSIONS[ROLES.DOCTOR], { delay: 180 });
  },

  createDoctorAccount(payload) {
    return resolve(
      {
        user: {
          id: Date.now(),
          user_name: payload.user_name,
          email: payload.email,
          role: ROLES.DOCTOR,
          is_active: true,
          patient_profile_exists: false,
          doctor_profile_exists: true,
        },
        doctor: {
          id: Date.now(),
          name: payload.name,
          department_id: payload.department_id,
          qualification: payload.qualification,
          experience_years: payload.experience_years,
          phone: payload.phone,
          consultation_fee: payload.consultation_fee,
          room_number: payload.room_number,
        },
      },
      { delay: 600 },
    );
  },

  logout() {
    return resolve({ ok: true }, { delay: 120 });
  },

  requestPasswordReset(email) {
    return resolve({ email, sent: true }, { delay: 800 });
  },

  resetPassword(token) {
    return resolve({ token, reset: true }, { delay: 800 });
  },
};

export { DEMO_SESSIONS };
export default authService;
