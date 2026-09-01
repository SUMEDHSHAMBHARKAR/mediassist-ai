import cx from "../../utils/classNames";
import Icon from "./Icon";
import IconButton from "./IconButton";

const TONE_ICON = {
  neutral: "info",
  accent: "info",
  success: "checkCircle",
  warning: "alertTriangle",
  critical: "alertCircle",
};

/** Banner — inline contextual message. Not a toast; it stays in the flow. */
function Banner({
  children,
  title,
  tone = "neutral",
  icon,
  action,
  onDismiss,
  className,
}) {
  return (
    <div
      className={cx("banner", tone !== "neutral" && `banner--${tone}`, className)}
      role={tone === "critical" ? "alert" : "status"}
    >
      <span className="banner__icon" aria-hidden="true">
        <Icon name={icon || TONE_ICON[tone]} size={16} />
      </span>

      <div className="grow col col--gap-xxs">
        {title && <span className="banner__title">{title}</span>}
        <span>{children}</span>
      </div>

      {action}

      {onDismiss && (
        <IconButton icon="close" label="Dismiss" size="sm" onClick={onDismiss} />
      )}
    </div>
  );
}

/** Progress — determinate bar used for uploads and quota read-outs. */
export function Progress({ value = 0, tone, label, className }) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={className}>
      <div
        className="progress"
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className={cx("progress__fill", tone && `progress__fill--${tone}`)}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

export default Banner;
