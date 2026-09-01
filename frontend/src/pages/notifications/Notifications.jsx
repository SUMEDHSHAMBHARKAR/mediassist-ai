import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card, { CardBody, CardHead } from "../../components/ui/Card";
import Icon from "../../components/ui/Icon";
import PageHeader from "../../components/ui/PageHeader";
import SearchInput from "../../components/ui/SearchInput";
import StatCard from "../../components/ui/StatCard";
import Tabs from "../../components/ui/Tabs";
import {
  EmptyState,
  ErrorState,
  SkeletonRows,
} from "../../components/ui/States";
import {
  NOTIFICATION_META,
  NOTIFICATION_TYPES,
} from "../../constants/statuses";
import { useNotifications } from "../../context/NotificationContext";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import cx from "../../utils/classNames";
import { searchBy } from "../../utils/collection";
import { formatDateTime, formatRelative, humanize } from "../../utils/format";

const PRIORITY_TONE = { critical: "critical", high: "warning", normal: "muted" };

/**
 * Notifications — the notification centre.
 *
 * Reads the same context as the navbar panel, so marking something read here is
 * immediately reflected in the badge.
 */
function Notifications() {
  useDocumentTitle("Notifications");

  const { items, unreadCount, loading, error, markRead, markAllRead, reload } =
    useNotifications();

  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    let result = items;

    if (tab === "unread") result = result.filter((item) => !item.read);
    else if (tab !== "all") result = result.filter((item) => item.type === tab);

    return searchBy(result, query, ["title", "body"]);
  }, [items, tab, query]);

  const counts = useMemo(
    () =>
      items.reduce((acc, item) => {
        acc[item.type] = (acc[item.type] || 0) + 1;
        return acc;
      }, {}),
    [items],
  );

  const critical = items.filter(
    (item) => item.priority === "critical" && !item.read,
  ).length;

  if (error) {
    return (
      <div className="page">
        <PageHeader eyebrow="Operations" title="Notifications" />
        <ErrorState
          title="Notifications unavailable"
          message="The notification feed could not be loaded."
          onRetry={reload}
        />
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Operations"
        title="Notifications"
        lede="Clinical alerts, schedule changes, results and billing events."
        actions={
          unreadCount > 0 && (
            <Button variant="primary" icon="check" onClick={markAllRead}>
              Mark all read
            </Button>
          )
        }
      />

      <section className="grid grid--4" style={{ marginBottom: "var(--s-lg)" }}>
        <StatCard label="Unread" value={unreadCount} icon="notifications" />
        <StatCard label="Needs attention" value={critical} icon="alertTriangle" />
        <StatCard
          label="Clinical results"
          value={counts[NOTIFICATION_TYPES.REPORT] || 0}
          icon="reports"
        />
        <StatCard label="Total" value={items.length} icon="inbox" />
      </section>

      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: "all", label: "All", count: items.length },
          { value: "unread", label: "Unread", count: unreadCount },
          {
            value: NOTIFICATION_TYPES.APPOINTMENT,
            label: "Appointments",
            count: counts[NOTIFICATION_TYPES.APPOINTMENT] || 0,
          },
          {
            value: NOTIFICATION_TYPES.REPORT,
            label: "Reports",
            count: counts[NOTIFICATION_TYPES.REPORT] || 0,
          },
          {
            value: NOTIFICATION_TYPES.BILLING,
            label: "Billing",
            count: counts[NOTIFICATION_TYPES.BILLING] || 0,
          },
          {
            value: NOTIFICATION_TYPES.AI,
            label: "AI",
            count: counts[NOTIFICATION_TYPES.AI] || 0,
          },
          {
            value: NOTIFICATION_TYPES.SYSTEM,
            label: "System",
            count: counts[NOTIFICATION_TYPES.SYSTEM] || 0,
          },
        ]}
        className="stack"
      />

      <div style={{ marginTop: "var(--s-lg)" }}>
        <Card surface="soft">
          <CardHead
            title={tab === "unread" ? "Unread" : "Notifications"}
            subtitle={loading ? "Loading" : `${filtered.length} shown`}
            actions={
              <div style={{ width: 220 }}>
                <SearchInput
                  value={query}
                  onChange={setQuery}
                  placeholder="Search notifications"
                  size="sm"
                />
              </div>
            }
          />

          <CardBody padding="none">
            {loading ? (
              <div style={{ padding: "var(--s-md)" }}>
                <SkeletonRows rows={6} />
              </div>
            ) : filtered.length === 0 ? (
              query ? (
                <EmptyState
                  size="compact"
                  icon="search"
                  title="No matching notifications"
                  message={`Nothing found for “${query}”.`}
                  secondary={
                    <Button variant="outline" icon="close" onClick={() => setQuery("")}>
                      Clear search
                    </Button>
                  }
                />
              ) : tab === "unread" ? (
                <EmptyState
                  size="compact"
                  icon="checkCircle"
                  title="Nothing unread"
                  message="You are up to date. New alerts will appear here."
                />
              ) : (
                <EmptyState
                  size="compact"
                  icon="inbox"
                  title="No notifications"
                  message="Alerts about appointments, results and billing appear here."
                />
              )
            ) : (
              <div className="list">
                {filtered.map((item) => {
                  const meta = NOTIFICATION_META[item.type] || { icon: "info" };

                  return (
                    <div
                      className={cx("list__row", !item.read && "list__row--unread")}
                      key={item.id}
                    >
                      <span
                        className={cx(
                          "file-row__icon",
                          item.priority === "critical" && "t-critical",
                        )}
                        aria-hidden="true"
                      >
                        <Icon name={meta.icon} size={16} />
                      </span>

                      <div className="grow col col--gap-xxs" style={{ minWidth: 0 }}>
                        <span className="row row--tight row--wrap">
                          {!item.read && (
                            <span
                              className="badge__dot"
                              style={{ background: "var(--accent)" }}
                              aria-label="Unread"
                            />
                          )}
                          <span className="t-data t-ink">{item.title}</span>
                          {item.priority !== "normal" && (
                            <Badge tone={PRIORITY_TONE[item.priority]}>
                              {item.priority}
                            </Badge>
                          )}
                          <Badge tone="muted">{humanize(item.type)}</Badge>
                        </span>

                        <span className="t-body-sm">{item.body}</span>

                        <span className="t-caption">
                          {formatRelative(item.createdAt)} ·{" "}
                          {formatDateTime(item.createdAt)}
                        </span>
                      </div>

                      <div className="row row--tight">
                        {item.link && (
                          <Link
                            to={item.link}
                            className="text-link text-link--sm"
                            onClick={() => markRead(item.id)}
                          >
                            Open
                            <Icon name="arrowRight" size={12} />
                          </Link>
                        )}
                        {!item.read && (
                          <Button
                            size="sm"
                            variant="ghost"
                            icon="check"
                            onClick={() => markRead(item.id)}
                          >
                            Read
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default Notifications;
