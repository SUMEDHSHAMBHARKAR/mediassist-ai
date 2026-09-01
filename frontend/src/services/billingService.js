import { api } from "./apiClient";

/**
 * Billing service connected to FastAPI endpoints:
 *   listByPatient -> GET   /billing/patient/{patient_id}
 *   getById       -> GET   /billing/{billing_id}
 *   create        -> POST  /billing
 *   update        -> PATCH /billing/{billing_id}
 *   remove        -> DELETE /billing/{billing_id}
 */
export const billingService = {
  // The current API exposes billing records by patient only.
  list() {
    return Promise.resolve([]);
  },
  async listByPatient(patientId, params = {}) {
    if (!patientId || patientId === "undefined" || patientId === "null") return [];
    const res = await api.get(`/billing/patient/${patientId}`, { params });
    if (res && Array.isArray(res.items)) {
      return res.items;
    }
    return Array.isArray(res) ? res : [];
  },

  getById(invoiceId) {
    return api.get(`/billing/${invoiceId}`);
  },

  create(payload) {
    return api.post("/billing", payload);
  },

  update(billingId, payload) {
    return api.patch(`/billing/${billingId}`, payload);
  },

  remove(billingId) {
    return api.delete(`/billing/${billingId}`);
  },

  recordPayment(invoiceId, { payment_method = "cash" } = {}) {
    return this.update(invoiceId, { payment_status: "paid", payment_method });
  },
};

export default billingService;
