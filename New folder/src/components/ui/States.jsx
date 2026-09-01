import cx from "../../utils/classNames";
import Button from "./Button";
import Icon from "./Icon";

/**
 * EmptyState — "nothing here yet", with the action that would create the first
 * item. Distinct from a filtered-to-zero result, which passes `filtered`.
 */
export function EmptyState({
  icon = "inbox",
  title = "Nothing here yet",
  message,
  action,
  actionLabel,
  actionIcon,
  actionTo,
  secondary,
  size = "md",
  className,
}) {
  return (
    <div
      className={cx(
        "state",
        size === "compact" && "state--compact",
        size === "inline" && "state--inline",
        className,
      )}
    >
      <span className="state__icon" aria-hidden="true">
        <Icon name={icon} size={22} />
      </span>

      <h3 className="state__title">{title}</h3>
      {message && <p className="state__text">{message}</p>}

      {(actionLabel || secondary) && (
        <div className="state__actions">
          {actionLabel && (
            <Button
              variant="primary"
              icon={actionIcon}
              onClick={action}
              to={actionTo}
            >
              {actionLabel}
            </Button>
          )}
          {secondary}
        </div>
      )}
    </div>
  );
}

/**
 * ErrorState — failure with a retry. Message should say what failed, not just
 * "something went wrong".
 */
export function ErrorState({
  title = "Could not load this data",
  message = "The request did not complete. Check your connection and try again.",
  onRetry,
  detail,
  size = "md",
  className,
}) {
  return (
    <div
      className={cx(
        "state",
        size === "compact" && "state--compact",
        size === "inline" && "state--inline",
        className,
      )}
      role="alert"
    >
      <span className="state__icon state__icon--critical" aria-hidden="true">
        <Icon name="alertTriangle" size={22} />
      </span>

      <h3 className="state__title">{title}</h3>
      <p className="state__text">{message}</p>
      {detail && <p className="t-mono t-muted">{detail}</p>}

      {onRetry && (
        <div className="state__actions">
          <Button variant="outline" icon="refresh" onClick={onRetry}>
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}

/** Centred spinner for whole-panel loads where no layout is known in advance. */
export function LoadingState({ label = "Loading", size = "md", className }) {
  return (
    <div
      className={cx(
        "state",
        size === "compact" && "state--compact",
        size === "inline" && "state--inline",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <span className="spinner spinner--lg" aria-hidden="true" />
      <span className="t-label t-label--sm">{label}</span>
    </div>
  );
}

/** Skeleton primitives — used where the final layout is predictable. */
export function Skeleton({ variant = "text", width, height, className }) {
  return (
    <span
      className={cx("skeleton", `skeleton--${variant}`, className)}
      style={{ width, height, display: "block" }}
      aria-hidden="true"
    />
  );
}

export function SkeletonRows({ rows = 5, className }) {
  return (
    <div className={cx("skeleton-rows", className)} aria-hidden="true">
      {Array.from({ length: rows }, (_, index) => (
        <div className="row row--loose" key={index}>
          <Skeleton variant="avatar" />
          <div className="grow col col--gap-xs">
            <Skeleton variant="line" width={`${45 + ((index * 13) % 30)}%`} />
            <Skeleton variant="line" width={`${25 + ((index * 7) % 20)}%`} />
          </div>
          <Skeleton variant="line" width={72} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonCards({ count = 4, height = 118, className }) {
  return (
    <div className={cx("grid", "grid--4", className)} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} variant="block" height={height} />
      ))}
    </div>
  );
}

/**
 * AsyncBoundary — one place that decides between loading / error / empty /
 * content so no page reimplements the ladder.
 */
export function AsyncBoundary({
  loading,
  error,
  isEmpty = false,
  onRetry,
  skeleton,
  empty,
  loadingLabel,
  children,
}) {
  if (loading) return skeleton || <LoadingState label={loadingLabel} />;
  if (error) {
    return (
      <ErrorState
        message={typeof error === "string" ? error : error?.message}
        onRetry={onRetry}
      />
    );
  }
  if (isEmpty) return empty || <EmptyState />;

  return children;
}

export default AsyncBoundary;
