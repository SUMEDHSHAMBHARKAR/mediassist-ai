/**
 * BarChart — flat vertical bars on a hairline baseline grid.
 *
 * Deliberately dependency-free: the design system's charts are square-cornered
 * rectangles with uppercase axis labels, which is a handful of SVG nodes.
 *
 * data: [{ label, value, tone? }]
 */
function BarChart({
  data,
  height = 220,
  valueFormatter = (value) => value,
  highlightLast = false,
}) {
  const width = 640;
  const padTop = 16;
  const padBottom = 28;
  const padLeft = 44;
  const padRight = 8;

  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;

  const max = Math.max(...data.map((d) => d.value), 1);
  // Round the axis ceiling up so gridlines land on readable numbers.
  const magnitude = 10 ** Math.floor(Math.log10(max));
  const ceiling = Math.ceil(max / magnitude) * magnitude;

  const slot = plotWidth / data.length;
  const barWidth = Math.min(slot * 0.56, 40);

  const gridLines = 4;

  return (
    <svg
      className="chart"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`Bar chart: ${data
        .map((d) => `${d.label} ${valueFormatter(d.value)}`)
        .join(", ")}`}
    >
      {Array.from({ length: gridLines + 1 }, (_, index) => {
        const ratio = index / gridLines;
        const y = padTop + plotHeight * ratio;
        const value = Math.round(ceiling * (1 - ratio));

        return (
          <g key={index}>
            <line
              className="chart__grid-line"
              x1={padLeft}
              y1={y}
              x2={width - padRight}
              y2={y}
            />
            <text
              className="chart__axis-label"
              x={padLeft - 8}
              y={y + 3}
              textAnchor="end"
            >
              {value >= 1000 ? `${Math.round(value / 1000)}k` : value}
            </text>
          </g>
        );
      })}

      {data.map((entry, index) => {
        const barHeight = ceiling === 0 ? 0 : (entry.value / ceiling) * plotHeight;
        const x = padLeft + slot * index + (slot - barWidth) / 2;
        const y = padTop + plotHeight - barHeight;
        const muted = highlightLast && index !== data.length - 1;

        return (
          <g key={entry.label}>
            <rect
              className={muted ? "chart__bar chart__bar--muted" : "chart__bar"}
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(barHeight, entry.value > 0 ? 2 : 0)}
            >
              <title>{`${entry.label}: ${valueFormatter(entry.value)}`}</title>
            </rect>

            <text
              className="chart__axis-label"
              x={padLeft + slot * index + slot / 2}
              y={height - 9}
              textAnchor="middle"
            >
              {entry.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default BarChart;
