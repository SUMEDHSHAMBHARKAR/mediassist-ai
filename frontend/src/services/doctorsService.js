import { api } from "./apiClient";

/**
 * Doctors & Schedules service connected directly to FastAPI endpoints:
 *   list           -> GET   /doctors
 *   getById        -> GET   /doctors/{doctor_id}
 *   byDepartment   -> GET   /doctors_by_department
 *   update         -> PATCH /doctors/{doctor_id}
 *   deactivate     -> PATCH /doctors/{doctor_id}/deactivate
 *   getSchedule    -> GET   /doctors/{doctor_id}/schedules
 *   getMySchedule  -> GET   /doctors/me/schedules
 *   createSchedule -> POST  /doctor-schedules
 *   updateSchedule -> PATCH /schedules/{schedule_id}
 *   deleteSchedule -> DELETE /schedules/{schedule_id}
 */

export const doctorsService = {
  async list(params = {}) {
    const res = await api.get("/doctors", { params });
    // Handle both paginated response shape and raw array
    if (res && Array.isArray(res.items)) {
      return res.items;
    }
    return Array.isArray(res) ? res : [];
  },

  async listPaginated(params = {}) {
    return await api.get("/doctors", { params });
  },

  getById(doctorId) {
    return api.get(`/doctors/${doctorId}`);
  },

  byDepartment(departmentId) {
    return api.get("/doctors_by_department", { params: { department_id: departmentId } });
  },

  update(doctorId, payload) {
    return api.patch(`/doctors/${doctorId}`, payload);
  },

  deactivate(doctorId) {
    return api.patch(`/doctors/${doctorId}/deactivate`);
  },

  getSchedule(doctorId) {
    return api.get(`/doctors/${doctorId}/schedules`);
  },

  getMySchedule() {
    return api.get("/doctors/me/schedules");
  },

  createSchedule(payload) {
    return api.post("/doctor-schedules", payload);
  },

  updateSchedule(scheduleId, payload) {
    return api.patch(`/schedules/${scheduleId}`, payload);
  },

  deleteSchedule(scheduleId) {
    return api.delete(`/schedules/${scheduleId}`);
  },
};

export default doctorsService;
