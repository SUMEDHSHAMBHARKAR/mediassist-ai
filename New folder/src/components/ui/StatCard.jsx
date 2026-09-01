import { Link } from "react-router-dom";

import cx from "../../utils/classNames";
import Icon from "./Icon";

/**
 * StatCard — the design system's spec-cell: a large display-weight value with
 * an uppercase label beneath it, optionally carrying a period-over-period delta.
 */
function StatCard({
  label,
  value,
  unit,
  icon,
  delta,
  deltaLabel,
  footnote,
  surface = "soft",
  to,
  className,
}) {
  const direction =
    delta === undefined || delta === null
      ? null
      : delta > 0
        ? "up"
        : delta < 0
          ? "down"
          : "flat";

  const body = (
    <>
      <div className="stat__top">
        <span className="stat__value t-tabular">
          {value}
          {unit && <span className="stat__unit">{unit}</span>}
        </span>
        {icon && (
          <span className="stat__icon" aria-hidden="true">
            <Icon name={icon} size={18} />
          </span>
        )}
      </div>

      <span className="stat__label">{label}</span>

      {(direction || footnote) && (
        <div className="stat__foot">
          {direction && (
            <span className={cx("stat__delta", `stat__delta--${direction}`)}>
              <Icon
                name={
                  direction === "up"
                    ? "arrowUp"
                    : direction === "down"
                      ? "arrowDown"
                      : "minus"
                }
                size={11}
                strokeWidth={2}
              />
              {Math.abs(delta)}%
            </span>
          )}
          {(deltaLabel || footnote) && (
            <span className="t-muted">{deltaLabel || footnote}</span>
          )}
        </div>
      )}
    </>
  );

  const classes = cx("stat", surface === "card" && "stat--card", className);

  if (to) {
    return (
      <Link to={to} className={cx(classes, "card--link")}>
        {body}
      </Link>
    );
  }

  return <div className={classes}>{body}</div>;
}

export default StatCard;
