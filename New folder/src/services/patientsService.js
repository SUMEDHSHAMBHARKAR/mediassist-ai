import { patients } from "../mock/patients";
import { resolve } from "./mockTransport";

/**
 * Patients service.
 *
 * Endpoint mapping for the eventual integration:
 *   list        -> GET    /patients
 *   getById     -> GET    /patients/{patient_id}
 *   getProfile  -> GET    /patients/profile
 *   create      -> POST   /patient
 *   update      -> PATCH  /patients/{patient_id}
 *   remove      -> DELETE /patients/{patient_id}
 *
 * Filtering and sorting stay client-side for now; when the backend takes over,
 * `params` maps onto query parameters.
 */
export const patientsService = {
  list(params = {}) {
    let result = [...patients];

    if (params.gender) {
      result = result.filter((p) => p.gender?.toLowerCase() === params.gender?.toLowerCase());
    }
    if (params.name) {
      result = result.filter((p) => p.name?.toLowerCase().includes(params.name?.toLowerCase()));
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      result = result.filter((p) => p.name?.toLowerCase().includes(q) || p.mobile_no?.includes(q) || p.address?.toLowerCase().includes(q));
    }

    return resolve(result);
  },

  getById(patientId) {
    const patient = patients.find((entry) => String(entry.id) === String(patientId) || entry.id === patientId);

    if (!patient) {
      return Promise.reject(new Error(`No patient found for id ${patientId}.`));
    }

    return resolve(patient);
  },

  /** GET /patients/profile */
  getProfile(patientId) {
    if (patientId) return this.getById(patientId);
    return resolve(patients[0]);
  },

  /** POST /profile */
  createProfile(payload) {
    return resolve({ ...payload, id: Date.now() }, { delay: 420 });
  },

  /** PATCH /patient/profile */
  updateProfile(payload) {
    return resolve({ ...payload }, { delay: 420 });
  },

  listByDoctor(doctorId) {
    return resolve(patients.filter((entry) => String(entry.primaryDoctorId) === String(doctorId) || entry.primaryDoctorId === doctorId));
  },

  create(payload) {
    return resolve({ ...payload, id: `pat-${Date.now()}` }, { delay: 420 });
  },

  update(patientId, payload) {
    return resolve({ id: patientId, ...payload }, { delay: 420 });
  },

  remove(patientId) {
    return resolve({ id: patientId, deleted: true }, { delay: 360 });
  },
};

export default patientsService;
