import { api } from "./apiClient";

/**
 * Notifications service connected to FastAPI endpoints:
 *   listForUser -> GET   /notifications/user/{user_id}
 *   markRead    -> PATCH /notifications/{notification_id}/read
 *   create      -> POST  /notifications/
 */
export const notificationsService = {
  async listForUser(userId, params = {}) {
    if (!userId) return [];
    const res = await api.get(`/notifications/user/${userId}`, { params });
    if (res && Array.isArray(res.items)) {
      return res.items;
    }
    return Array.isArray(res) ? res : [];
  },

  markRead(notificationId) {
    return api.patch(`/notifications/${notificationId}/read`);
  },

  async markAllRead(ids = []) {
    if (!Array.isArray(ids)) return { read: true };
    await Promise.all(ids.map((id) => this.markRead(id).catch(() => null)));
    return { read: true };
  },

  create(payload) {
    return api.post("/notifications/", {
      user_id: payload.user_id || payload.userId,
      title: payload.title,
      message: payload.message || payload.body,
      notification_type: payload.notification_type || payload.type || "system",
    });
  },
};

export default notificationsService;
