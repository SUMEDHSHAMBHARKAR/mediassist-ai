import { Link } from "react-router-dom";

import Timeline from "../ui/Timeline";

/**
 * ActivityFeed — recent audit-style events for dashboards.
 *
 * Maps the feed shape onto the shared Timeline so activity, patient history and
 * audit trails all use one vertical rhythm.
 */
function ActivityFeed({ items, className }) {
  const entries = items.map((item) => ({
    id: item.id,
    tone: item.tone,
    meta: item.at,
    title: (
      <>
        <span className="t-ink">{item.actor}</span>{" "}
        <span className="t-muted" style={{ fontWeight: 400 }}>
          {item.action}
        </span>{" "}
        {item.targetTo ? (
          <Link to={item.targetTo} className="t-accent">
            {item.target}
          </Link>
        ) : (
          <span className="t-ink">{item.target}</span>
        )}
      </>
    ),
  }));

  return <Timeline items={entries} className={className} />;
}

export default ActivityFeed;
