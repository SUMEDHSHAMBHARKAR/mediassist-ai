import { doctors } from "../mock/doctors";
import { slotsForDoctor, weeklyScheduleForDoctor } from "../mock/schedules";
import { resolve } from "./mockTransport";

/**
 * Doctors service.
 *
 *   list           -> GET /doctors
 *   getById        -> GET /doctors/{doctor_id}
 *   byDepartment   -> GET /doctors_by_department
 *   getSchedule    -> GET /doctors/{doctor_id}/schedules
 *   getMySchedule  -> GET /doctors/me/schedules
 */
export const doctorsService = {
  list(params = {}) {
    let result = [...doctors];
    if (params.department_id !== undefined && params.department_id !== null) {
      result = result.filter((d) => String(d.department_id) === String(params.department_id));
    }
    if (params.is_active !== undefined && params.is_active !== null) {
      result = result.filter((d) => Boolean(d.is_active) === Boolean(params.is_active));
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      result = result.filter((d) => d.name?.toLowerCase().includes(q) || d.qualification?.toLowerCase().includes(q));
    }
    return resolve(result);
  },

  getById(doctorId) {
    const doctor = doctors.find((entry) => String(entry.id) === String(doctorId) || entry.id === doctorId);

    if (!doctor) {
      return Promise.reject(new Error(`No clinician found for id ${doctorId}.`));
    }

    return resolve(doctor);
  },

  /** Grouped shape or GET /doctors_by_department */
  byDepartment(departmentId) {
    if (departmentId !== undefined && departmentId !== null) {
      return resolve(doctors.filter((d) => String(d.department_id) === String(departmentId)));
    }

    const grouped = doctors.reduce((map, doctor) => {
      const dept = doctor.department || "General";
      if (!map[dept]) map[dept] = [];
      map[dept].push(doctor);
      return map;
    }, {});

    return resolve(
      Object.entries(grouped).map(([department, list]) => ({
        department,
        doctors: list,
      })),
    );
  },

  update(doctorId, payload) {
    return resolve({ id: doctorId, ...payload }, { delay: 350 });
  },

  deactivate(doctorId) {
    return resolve({ id: doctorId, is_active: false }, { delay: 350 });
  },

  getSchedule(doctorId) {
    return resolve({
      doctorId,
      weekly: weeklyScheduleForDoctor(doctorId),
      days: slotsForDoctor(doctorId, 7),
    });
  },

  getMySchedule(doctorId) {
    return this.getSchedule(doctorId);
  },

  createSchedule(payload) {
    return resolve({ id: Date.now(), ...payload }, { delay: 350 });
  },

  updateSchedule(scheduleId, payload) {
    return resolve({ id: scheduleId, ...payload }, { delay: 350 });
  },

  deleteSchedule(scheduleId) {
    return resolve({ id: scheduleId, deleted: true }, { delay: 300 });
  },
};

export default doctorsService;
