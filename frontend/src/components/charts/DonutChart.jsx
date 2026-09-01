/**
 * DonutChart — proportional ring with a centred read-out.
 *
 * Built from stroke-dasharray arcs on concentric circles: no path math, no
 * dependency, and the segments stay crisp at any size.
 *
 * data: [{ label, value, color }]
 */
function DonutChart({ data, size = 180, thickness = 18, centerLabel, centerValue }) {
  const total = data.reduce((sum, entry) => sum + entry.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;

  return (
    <div className="row row--loose row--wrap" style={{ gap: "var(--s-lg)" }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`Donut chart: ${data
          .map((d) => `${d.label} ${d.value}`)
          .join(", ")}`}
        style={{ flex: "none" }}
      >
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--surface-elevated)"
            strokeWidth={thickness}
          />

          {total > 0 &&
            data.map((entry) => {
              const length = (entry.value / total) * circumference;
              const dash = `${Math.max(length - 2, 0)} ${circumference - Math.max(length - 2, 0)}`;
              const rotation = offset;
              offset += length;

              return (
                <circle
                  key={entry.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={entry.color}
                  strokeWidth={thickness}
                  strokeDasharray={dash}
                  strokeDashoffset={-rotation}
                >
                  <title>{`${entry.label}: ${entry.value}`}</title>
                </circle>
              );
            })}
        </g>

        {(centerValue || centerLabel) && (
          <>
            <text
              x="50%"
              y="48%"
              textAnchor="middle"
              fill="var(--ink)"
              style={{
                fontSize: 26,
                fontWeight: 700,
                letterSpacing: "-0.5px",
              }}
            >
              {centerValue}
            </text>
            <text
              x="50%"
              y="62%"
              textAnchor="middle"
              fill="var(--muted)"
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "1.4px",
                textTransform: "uppercase",
              }}
            >
              {centerLabel}
            </text>
          </>
        )}
      </svg>

      <ul className="col col--gap-sm grow">
        {data.map((entry) => (
          <li className="row row--between" key={entry.label}>
            <span className="row row--tight">
              <span
                className="chart-legend__swatch"
                style={{ background: entry.color }}
                aria-hidden="true"
              />
              <span className="t-data t-strong">{entry.label}</span>
            </span>
            <span className="t-data t-ink t-tabular">
              {entry.value}
              <span className="t-muted">
                {" "}
                · {total > 0 ? Math.round((entry.value / total) * 100) : 0}%
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default DonutChart;
