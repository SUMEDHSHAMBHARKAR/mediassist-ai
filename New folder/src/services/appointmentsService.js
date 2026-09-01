import { appointments } from "../mock/appointments";
import { isFuture, isSameDay } from "../utils/collection";
import { resolve } from "./mockTransport";

/**
 * Appointments service.
 *
 *   list          -> GET   /appointments
 *   listForDoctor -> GET   /doctor/me/appointments
 *   listForPatient-> GET   /patient/me/appointments
 *   listUpcoming  -> GET   /appointments/upcoming
 *   listToday     -> GET   /appointments/today
 *   getById       -> GET   /appointments/{appointment_id}
 *   create        -> POST  /appointment
 *   setStatus     -> PATCH /appointments/{appointment_id}/status
 *   reschedule    -> PATCH /appointments/{appointment_id}/reschedule
 *   cancel        -> PATCH /appointments/{appointment_id}/cancel
 */
export const appointmentsService = {
  list(params = {}) {
    let result = [...appointments];

    if (params.doctor_id) {
      result = result.filter((a) => String(a.doctorId || a.doctor_id) === String(params.doctor_id));
    }
    if (params.patient_id) {
      result = result.filter((a) => String(a.patientId || a.patient_id) === String(params.patient_id));
    }
    if (params.status) {
      result = result.filter((a) => a.status?.toLowerCase() === params.status?.toLowerCase());
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      result = result.filter((a) => a.reason?.toLowerCase().includes(q) || a.code?.toLowerCase().includes(q));
    }

    return resolve(result);
  },

  getById(appointmentId) {
    const appointment = appointments.find((entry) => String(entry.id) === String(appointmentId) || entry.id === appointmentId);

    if (!appointment) {
      return Promise.reject(new Error(`No appointment found for id ${appointmentId}.`));
    }

    return resolve(appointment);
  },

  listForDoctor(doctorId) {
    return resolve(appointments.filter((entry) => String(entry.doctorId) === String(doctorId) || entry.doctorId === doctorId));
  },

  listForPatient(patientId) {
    return resolve(appointments.filter((entry) => String(entry.patientId) === String(patientId) || entry.patientId === patientId));
  },

  listToday(doctorId) {
    let result = appointments.filter((entry) => isSameDay(entry.startsAt));
    if (doctorId) {
      result = result.filter((entry) => String(entry.doctorId) === String(doctorId));
    }
    return resolve(result);
  },

  listUpcoming(doctorId, limit) {
    let upcoming = appointments
      .filter((entry) => isFuture(entry.startsAt))
      .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));

    if (typeof doctorId === "number" || (typeof doctorId === "string" && !isNaN(Number(doctorId)))) {
      upcoming = upcoming.filter((entry) => String(entry.doctorId) === String(doctorId));
    }

    return resolve(limit ? upcoming.slice(0, limit) : upcoming);
  },

  create(payload) {
    return resolve(
      {
        doctor_id: payload.doctor_id || payload.doctorId,
        appointment_date: payload.appointment_date || payload.date,
        appointment_time: payload.appointment_time || payload.time,
        reason: payload.reason,
        appointment_type: payload.appointment_type || payload.type,
        id: `apt-${Date.now()}`,
        code: `APT-${Date.now()}`,
        status: "Scheduled",
      },
      { delay: 480 },
    );
  },

  setStatus(appointmentId, statusUpdate) {
    const status = typeof statusUpdate === "object" ? statusUpdate.status : statusUpdate;
    return resolve({ id: appointmentId, status }, { delay: 360 });
  },

  reschedule(appointmentId, reschedulePayload) {
    return resolve({ id: appointmentId, ...(typeof reschedulePayload === "object" ? reschedulePayload : { startsAt: reschedulePayload }) }, { delay: 420 });
  },

  cancel(appointmentId, reason) {
    return resolve(
      { id: appointmentId, status: "Cancelled", cancellationReason: reason },
      { delay: 380 },
    );
  },
};

export default appointmentsService;
