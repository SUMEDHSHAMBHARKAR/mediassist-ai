/**
 * LineChart — single series with a tinted area fill and point markers.
 * data: [{ label, value }]
 */
function LineChart({
  data,
  height = 220,
  valueFormatter = (value) => value,
  showArea = true,
  showPoints = true,
}) {
  const width = 640;
  const padTop = 16;
  const padBottom = 28;
  const padLeft = 44;
  const padRight = 12;

  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;

  const values = data.map((d) => d.value);
  const max = Math.max(...values, 1);
  const magnitude = 10 ** Math.floor(Math.log10(max));
  const ceiling = Math.ceil(max / magnitude) * magnitude;

  const stepX = data.length > 1 ? plotWidth / (data.length - 1) : 0;

  const points = data.map((entry, index) => ({
    ...entry,
    x: padLeft + stepX * index,
    y: padTop + plotHeight - (entry.value / ceiling) * plotHeight,
  }));

  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`)
    .join(" ");

  const areaPath = `${path} L${points[points.length - 1]?.x ?? padLeft} ${
    padTop + plotHeight
  } L${points[0]?.x ?? padLeft} ${padTop + plotHeight} Z`;

  const gridLines = 4;
  // Thin out x labels when the series is dense so they never overlap.
  const labelStep = Math.ceil(data.length / 8);

  return (
    <svg
      className="chart"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`Line chart: ${data
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

      {showArea && points.length > 1 && <path className="chart__area" d={areaPath} />}
      {points.length > 1 && <path className="chart__line" d={path} />}

      {showPoints &&
        points.map((point) => (
          <circle
            key={point.label}
            className="chart__point"
            cx={point.x}
            cy={point.y}
            r={3.5}
          >
            <title>{`${point.label}: ${valueFormatter(point.value)}`}</title>
          </circle>
        ))}

      {points.map((point, index) =>
        index % labelStep === 0 || index === points.length - 1 ? (
          <text
            key={`label-${point.label}`}
            className="chart__axis-label"
            x={point.x}
            y={height - 9}
            textAnchor={
              index === 0 ? "start" : index === points.length - 1 ? "end" : "middle"
            }
          >
            {point.label}
          </text>
        ) : null,
      )}
    </svg>
  );
}

export default LineChart;
