import { api } from "./apiClient";

/**
 * Medical records service connected to FastAPI backend.
 */
export const medicalRecordsService = {
  // The current API exposes records by patient only. Return an empty index for
  // organisation-wide views until that endpoint is added, rather than throwing
  // from the UI.
  list() {
    return Promise.resolve([]);
  },
  async listByPatient(patientId, params = {}) {
    const res = await api.get(`/medical-records/patient/${patientId}`, { params });
    if (res && Array.isArray(res.items)) {
      return res.items;
    }
    return Array.isArray(res) ? res : [];
  },

  getById(recordId) {
    return api.get(`/medical-records/${recordId}`);
  },

  create(payload) {
    return api.post("/medical-records/", payload);
  },

  update(recordId, payload) {
    return api.put(`/medical-records/${recordId}`, payload);
  },

  remove(recordId) {
    return api.delete(`/medical-records/${recordId}`);
  },
};

/**
 * Reports service connected to FastAPI backend.
 */
export const reportsService = {
  // The backend currently scopes report listings to a patient.
  list() {
    return Promise.resolve([]);
  },
  async listByPatient(patientId, params = {}) {
    if (!patientId || patientId === "undefined" || patientId === "null") return [];
    const res = await api.get(`/reports/patient/${patientId}`, { params });
    if (res && Array.isArray(res.items)) {
      return res.items;
    }
    return Array.isArray(res) ? res : [];
  },

  getById(reportId) {
    return api.get(`/reports/${reportId}`);
  },

  create(payload) {
    return this.upload(payload);
  },

  upload(payload) {
    let formData;
    if (payload instanceof FormData) {
      formData = payload;
    } else {
      formData = new FormData();
      if (payload.file) formData.append("file", payload.file);
      formData.append("patient_id", String(payload.patient_id || payload.patientId));
      formData.append("report_type", payload.report_type || payload.type || "Blood Report");
      if (payload.notes) formData.append("notes", payload.notes);
    }
    return api.post("/reports/", formData);
  },

  download(reportId) {
    return api.get(`/reports/download/${reportId}`, { responseType: "blob" });
  },

  remove(reportId) {
    return api.delete(`/reports/${reportId}`);
  },
};

/**
 * Prescriptions service connected to FastAPI backend.
 */
export const prescriptionsService = {
  // The backend currently scopes prescription listings to a patient or doctor.
  list() {
    return Promise.resolve([]);
  },
  async listByPatient(patientId, params = {}) {
    if (!patientId || patientId === "undefined" || patientId === "null") return [];
    const res = await api.get(`/prescriptions/patient/${patientId}`, { params });
    if (res && Array.isArray(res.items)) {
      return res.items;
    }
    return Array.isArray(res) ? res : [];
  },

  async listByDoctor(doctorId, params = {}) {
    const res = await api.get(`/prescriptions/doctor/${doctorId}`, { params });
    if (res && Array.isArray(res.items)) {
      return res.items;
    }
    return Array.isArray(res) ? res : [];
  },

  getById(prescriptionId) {
    return api.get(`/prescriptions/${prescriptionId}`);
  },

  create(payload) {
    return api.post("/prescriptions/", payload);
  },

  update(prescriptionId, updateData) {
    return api.put(`/prescriptions/${prescriptionId}`, updateData);
  },

  remove(prescriptionId) {
    return api.delete(`/prescriptions/${prescriptionId}`);
  },
};
