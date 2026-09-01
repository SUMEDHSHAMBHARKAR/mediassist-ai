import { notifications } from "../mock/notifications";
import { resolve } from "./mockTransport";

/**
 * Notifications service.
 *
 *   listForUser -> GET   /notifications/user/{user_id}
 *   markRead    -> PATCH /notifications/{notification_id}/read
 *   create      -> POST  /notifications/
 */
export const notificationsService = {
  listForUser(userId, params = {}) {
    let result = [...notifications];

    if (userId) {
      result = result.filter((n) => !n.userId || String(n.userId) === String(userId));
    }
    if (params.is_read !== undefined && params.is_read !== null) {
      result = result.filter((n) => n.is_read === params.is_read || n.read === params.is_read);
    }
    if (params.notification_type) {
      result = result.filter((n) => n.notification_type === params.notification_type || n.type === params.notification_type);
    }

    return resolve(
      result.sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at)),
      { delay: 200 },
    );
  },

  markRead(notificationId) {
    return resolve({ id: notificationId, read: true, is_read: true }, { delay: 160 });
  },

  /** Bulk mark-read is a client convenience; the backend exposes it per item. */
  markAllRead(ids) {
    return resolve({ ids, read: true, is_read: true }, { delay: 220 });
  },

  create(payload) {
    return resolve(
      {
        user_id: payload.user_id || payload.userId || 1,
        title: payload.title,
        message: payload.message || payload.body,
        notification_type: payload.notification_type || payload.type || "system",
        id: `ntf-${Date.now()}`,
        is_read: false,
        read: false,
        created_at: new Date().toISOString(),
      },
      { delay: 260 },
    );
  },
};

export default notificationsService;
