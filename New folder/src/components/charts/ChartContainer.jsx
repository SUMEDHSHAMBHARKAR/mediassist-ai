import cx from "../../utils/classNames";
import Card, { CardBody, CardHead } from "../ui/Card";

/**
 * ChartContainer — card frame around a chart, with an optional legend and a
 * loading/empty passthrough so dashboards do not repeat the ladder.
 */
function ChartContainer({
  title,
  subtitle,
  actions,
  legend,
  footer,
  loading = false,
  isEmpty = false,
  emptyMessage = "No data for this period.",
  height = 220,
  children,
  className,
}) {
  return (
    <Card surface="soft" className={cx(className)}>
      <CardHead title={title} subtitle={subtitle} actions={actions} />

      <CardBody>
        {loading ? (
          <div
            className="skeleton"
            style={{ height, display: "block" }}
            aria-hidden="true"
          />
        ) : isEmpty ? (
          <div
            className="row"
            style={{ height, justifyContent: "center", alignItems: "center" }}
          >
            <p className="t-caption">{emptyMessage}</p>
          </div>
        ) : (
          children
        )}

        {legend && !loading && !isEmpty && (
          <div className="chart-legend" style={{ marginTop: "var(--s-md)" }}>
            {legend.map((entry) => (
              <span className="chart-legend__item" key={entry.label}>
                <span
                  className="chart-legend__swatch"
                  style={{ background: entry.color }}
                  aria-hidden="true"
                />
                {entry.label}
              </span>
            ))}
          </div>
        )}
      </CardBody>

      {footer}
    </Card>
  );
}

export default ChartContainer;
