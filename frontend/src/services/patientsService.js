import { api } from "./apiClient";

/**
 * Patients service connected to FastAPI endpoints:
 *   list           -> GET    /patients
 *   getById        -> GET    /patients/{patient_id}
 *   getProfile     -> GET    /patients/profile
 *   createProfile  -> POST   /profile
 *   updateProfile  -> PATCH  /patient/profile
 *   create         -> POST   /patient
 *   update         -> PATCH  /patients/{patient_id}
 *   remove         -> DELETE /patients/{patient_id}
 */

export const patientsService = {
  async list(params = {}) {
    const response = await api.get("/patients", { params });
    return Array.isArray(response?.items) ? response.items : Array.isArray(response) ? response : [];
  },

  listPaginated(params = {}) {
    return api.get("/patients", { params });
  },

  getById(patientId) {
    return api.get(`/patients/${patientId}`);
  },

  getProfile() {
    return api.get("/patients/profile");
  },

  createProfile(payload) {
    return api.post("/profile", payload);
  },

  updateProfile(payload) {
    return api.patch("/patient/profile", payload);
  },

  listByDoctor(doctorId) {
    return this.list({ doctor_id: doctorId });
  },

  create(payload) {
    return api.post("/patient", payload);
  },

  update(patientId, payload) {
    return api.patch(`/patients/${patientId}`, payload);
  },

  remove(patientId) {
    return api.delete(`/patients/${patientId}`);
  },
};

export default patientsService;
