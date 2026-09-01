import cx from "../../utils/classNames";

/**
 * BarList — horizontal breakdown rows. Better than a pie for ranked categorical
 * data (departments, revenue split) and stays readable at any width.
 *
 * data: [{ label, value, color? }]
 */
function BarList({ data, valueFormatter = (value) => value, className }) {
  const max = Math.max(...data.map((entry) => entry.value), 1);

  return (
    <div className={cx("bar-list", className)}>
      {data.map((entry) => (
        <div className="bar-list__row" key={entry.label}>
          <div className="bar-list__head">
            <span className="bar-list__name">{entry.label}</span>
            <span className="bar-list__value">{valueFormatter(entry.value)}</span>
          </div>

          <div className="bar-list__track">
            <div
              className="bar-list__fill"
              style={{
                width: `${(entry.value / max) * 100}%`,
                background: entry.color || undefined,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default BarList;
