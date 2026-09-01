import { Link, useNavigate } from "react-router-dom";

import { NOTIFICATION_META } from "../constants/statuses";
import { useNotifications } from "../context/NotificationContext";
import cx from "../utils/classNames";
import { formatRelative } from "../utils/format";
import Dropdown from "./ui/Dropdown";
import Icon from "./ui/Icon";
import IconButton from "./ui/IconButton";
import { EmptyState, ErrorState, SkeletonRows } from "./ui/States";

/**
 * NotificationMenu — the navbar bell and its panel.
 *
 * Reads from NotificationContext so the badge, this panel and the notification
 * centre page can never disagree on the unread count.
 */
function NotificationMenu() {
  const { items, unreadCount, loading, error, markRead, markAllRead, reload } =
    useNotifications();
  const navigate = useNavigate();

  const recent = items.slice(0, 6);

  const open = (item) => {
    markRead(item.id);
    if (item.link) navigate(item.link);
  };

  return (
    <Dropdown
      wide
      trigger={({ toggle, open: isOpen }) => (
        <IconButton
          icon="notifications"
          label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : "Notifications"
          }
          onClick={toggle}
          active={isOpen}
          badge={unreadCount > 0}
        />
      )}
    >
      {({ close }) => (
        <>
          <div className="dropdown__head row row--between">
            <span className="t-label t-label--sm t-label--ink">
              Notifications
              {unreadCount > 0 && (
                <span className="t-accent"> · {unreadCount} new</span>
              )}
            </span>

            {unreadCount > 0 && (
              <button type="button" className="text-link text-link--sm" onClick={markAllRead}>
                Mark all read
              </button>
            )}
          </div>

          {loading ? (
            <div style={{ padding: "var(--s-md)" }}>
              <SkeletonRows rows={3} />
            </div>
          ) : error ? (
            <ErrorState
              size="inline"
              title="Notifications unavailable"
              message="The notification list could not be loaded."
              onRetry={reload}
            />
          ) : recent.length === 0 ? (
            <EmptyState
              size="inline"
              icon="checkCircle"
              title="All clear"
              message="You have no notifications right now."
            />
          ) : (
            <ul>
              {recent.map((item) => {
                const meta = NOTIFICATION_META[item.type] || { icon: "info" };

                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={cx(
                        "dropdown__item",
                        !item.read && "is-selected",
                      )}
                      style={{ alignItems: "flex-start", padding: "var(--s-sm) var(--s-md)" }}
                      onClick={() => {
                        open(item);
                        close();
                      }}
                    >
                      <span
                        className={cx("t-muted", item.priority === "critical" && "t-critical")}
                        style={{ marginTop: 2 }}
                      >
                        <Icon name={meta.icon} size={16} />
                      </span>

                      <span className="grow col col--gap-xxs">
                        <span className="row row--tight">
                          {!item.read && (
                            <span
                              className="badge__dot t-accent"
                              style={{ background: "var(--accent)" }}
                              aria-hidden="true"
                            />
                          )}
                          <span className="t-data t-ink">{item.title}</span>
                        </span>
                        <span className="t-caption t-clamp-2">{item.body}</span>
                        <span className="t-caption">{formatRelative(item.createdAt)}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="dropdown__sep" />

          <Link
            to="/notifications"
            className="dropdown__item"
            onClick={close}
            style={{ justifyContent: "space-between" }}
          >
            <span className="t-label t-label--sm t-label--ink">Open notification centre</span>
            <Icon name="arrowRight" size={14} />
          </Link>
        </>
      )}
    </Dropdown>
  );
}

export default NotificationMenu;
