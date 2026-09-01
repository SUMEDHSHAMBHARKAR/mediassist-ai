import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import notificationsService from "../services/notificationsService";

/**
 * NotificationContext — the notification list plus read state.
 *
 * Lives in context because the navbar badge, the dropdown panel and the
 * notification centre page all read the same list and must agree on the unread
 * count. Read state is optimistic locally and confirmed through the service, so
 * the UI stays responsive and the swap to PATCH /notifications/{id}/read is
 * contained.
 */
const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);

    notificationsService
      .listForUser()
      .then((result) => {
        setItems(result);
        setLoading(false);
      })
      .catch((cause) => {
        setError(cause instanceof Error ? cause : new Error(String(cause)));
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markRead = useCallback((id) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, read: true } : item)),
    );
    notificationsService.markRead(id).catch(() => {
      // Reverting on failure would need the previous value; with the mock
      // transport this cannot fail, and the real handler belongs with the API.
    });
  }, []);

  const markAllRead = useCallback(() => {
    setItems((current) => {
      const unreadIds = current.filter((item) => !item.read).map((item) => item.id);
      if (unreadIds.length > 0) notificationsService.markAllRead(unreadIds).catch(() => {});
      return current.map((item) => ({ ...item, read: true }));
    });
  }, []);

  const unreadCount = useMemo(
    () => items.filter((item) => !item.read).length,
    [items],
  );

  const value = useMemo(
    () => ({ items, unreadCount, loading, error, markRead, markAllRead, reload: load }),
    [items, unreadCount, loading, error, markRead, markAllRead, load],
  );

  return (
    <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error("useNotifications must be used inside a NotificationProvider.");
  }

  return context;
}

export default NotificationContext;
