import { invoices } from "../mock/billing";
import { resolve } from "./mockTransport";

/**
 * Billing service.
 *
 *   list          -> (composed client-side today)
 *   listByPatient -> GET  /billing/patient/{patient_id}
 *   getById       -> GET  /billing/{billing_id}
 *   create        -> POST /billing
 */
export const billingService = {
  list() {
    return resolve(invoices);
  },

  getById(invoiceId) {
    const invoice = invoices.find((entry) => String(entry.id) === String(invoiceId) || entry.id === invoiceId);

    if (!invoice) {
      return Promise.reject(new Error(`No invoice found for id ${invoiceId}.`));
    }

    return resolve(invoice);
  },

  listByPatient(patientId, params = {}) {
    let result = invoices.filter((entry) => String(entry.patientId || entry.patient_id) === String(patientId) || entry.patientId === patientId);

    if (params.payment_status) {
      result = result.filter((inv) => inv.status === params.payment_status || inv.payment_status === params.payment_status);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      result = result.filter((inv) => inv.invoiceNo?.toLowerCase().includes(q));
    }

    return resolve(
      result.sort((a, b) => new Date(b.issuedAt || b.created_at) - new Date(a.issuedAt || a.created_at)),
    );
  },

  create(payload) {
    return resolve(
      {
        ...payload,
        id: Date.now(),
        invoiceNo: `INV-${Date.now()}`,
        appointment_id: payload.appointment_id || payload.appointmentId,
        medicine_charge: payload.medicine_charge || 0,
        test_charge: payload.test_charge || 0,
        other_charge: payload.other_charge || 0,
        total_amount: (payload.medicine_charge || 0) + (payload.test_charge || 0) + (payload.other_charge || 0),
        payment_status: "pending",
      },
      { delay: 500 },
    );
  },

  update(billingId, payload) {
    return resolve({ id: billingId, ...payload }, { delay: 420 });
  },

  remove(billingId) {
    return resolve({ id: billingId, deleted: true }, { delay: 350 });
  },

  recordPayment(invoiceId, { _amount, method }) {
    return this.update(invoiceId, { payment_status: "paid", payment_method: method, paid_at: new Date().toISOString() });
  },
};

export default billingService;
