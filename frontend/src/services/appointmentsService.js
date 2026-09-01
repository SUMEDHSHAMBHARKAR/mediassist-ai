import { api } from "./apiClient";

function normaliseAppointment(appointment) {
  return {
    ...appointment,
    patientId: appointment.patientId ?? appointment.patient_id,
    doctorId: appointment.doctorId ?? appointment.doctor_id,
    startsAt: appointment.startsAt ?? `${appointment.appointment_date}T${appointment.appointment_time}`,
    type: appointment.type ?? appointment.appointment_type,
  };
}

function asAppointmentList(response) {
  const items = Array.isArray(response?.items) ? response.items : Array.isArray(response) ? response : [];
  return items.map(normaliseAppointment);
}

/**
 * Appointments service connected to FastAPI endpoints:
 *   list           -> GET   /appointments
 *   listForDoctor  -> GET   /doctor/me/appointments or /appointments?doctor_id=X
 *   listForPatient -> GET   /patient/me/appointments or /appointments?patient_id=X
 *   listToday      -> GET   /appointments/today
 *   listUpcoming   -> GET   /appointments/upcoming
 *   getById        -> GET   /appointments/{appointment_id}
 *   create         -> POST  /appointment
 *   setStatus      -> PATCH /appointments/{appointment_id}/status
 *   reschedule     -> PATCH /appointments/{appointment_id}/reschedule
 *   cancel         -> PATCH /appointments/{appointment_id}/cancel
 */
export const appointmentsService = {
  async list(params = {}) {
    const res = await api.get("/appointments", { params });
    return asAppointmentList(res);
  },

  async listPaginated(params = {}) {
    return await api.get("/appointments", { params });
  },

  getById(appointmentId) {
    return api.get(`/appointments/${appointmentId}`);
  },

  async listForDoctor(doctorId) {
    if (doctorId) {
      return this.list({ doctor_id: doctorId });
    }
    const res = await api.get("/doctor/me/appointments");
    return asAppointmentList(res);
  },

  async listForPatient(patientId) {
    if (patientId) {
      return this.list({ patient_id: patientId });
    }
    const res = await api.get("/patient/me/appointments");
    return asAppointmentList(res);
  },

  async listToday(doctorId) {
    const params = doctorId ? { doctor_id: doctorId } : {};
    const res = await api.get("/appointments/today", { params });
    return asAppointmentList(res);
  },

  async listUpcoming(doctorId, limit) {
    const params = doctorId ? { doctor_id: doctorId } : {};
    const res = await api.get("/appointments/upcoming", { params });
    const list = asAppointmentList(res);
    return limit ? list.slice(0, limit) : list;
  },

  create(payload) {
    const body = {
      doctor_id: Number(payload.doctor_id || payload.doctorId),
      appointment_date: payload.appointment_date || payload.date,
      appointment_time: payload.appointment_time || payload.time || "09:00:00",
      reason: payload.reason || "Consultation",
      appointment_type: payload.appointment_type || payload.type || "General",
    };
    return api.post("/appointment", body);
  },

  setStatus(appointmentId, statusUpdate) {
    const status = typeof statusUpdate === "object" ? statusUpdate.status : statusUpdate;
    return api.patch(`/appointments/${appointmentId}/status`, { status });
  },

  reschedule(appointmentId, reschedulePayload) {
    return api.patch(`/appointments/${appointmentId}/reschedule`, reschedulePayload);
  },

  cancel(appointmentId) {
    return api.patch(`/appointments/${appointmentId}/cancel`);
  },
};

export default appointmentsService;
