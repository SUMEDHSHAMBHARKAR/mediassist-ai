import cx from "../../utils/classNames";
import Icon from "./Icon";

/**
 * Badge — status chip. `tone` maps to the semantic tokens, never to arbitrary
 * colour, so severity reads consistently across every domain.
 */
function Badge({
  children,
  tone = "neutral",
  size = "md",
  dot = false,
  icon,
  className,
}) {
  return (
    <span
      className={cx(
        "badge",
        tone !== "neutral" && `badge--${tone}`,
        size === "lg" && "badge--lg",
        className,
      )}
    >
      {dot && <span className="badge__dot" aria-hidden="true" />}
      {icon && <Icon name={icon} size={11} strokeWidth={2} />}
      {children}
    </span>
  );
}

export default Badge;
