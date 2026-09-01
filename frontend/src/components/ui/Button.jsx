import { Link } from "react-router-dom";

import cx from "../../utils/classNames";
import Icon from "./Icon";

/**
 * Button — the system's rectangular, uppercase, letterspaced action.
 *
 * Renders as <button>, <a> or react-router <Link> depending on props, so call
 * sites never have to restyle a link to look like a button.
 */
function Button({
  children,
  variant = "outline",
  size = "md",
  icon,
  iconEnd,
  loading = false,
  disabled = false,
  block = false,
  to,
  href,
  type = "button",
  className,
  ...rest
}) {
  const classes = cx(
    "btn",
    `btn--${variant}`,
    size === "sm" && "btn--sm",
    block && "btn--block",
    className,
  );

  const iconSize = size === "sm" ? 14 : 16;

  const content = (
    <>
      {loading ? (
        <span className="btn__spinner" aria-hidden="true" />
      ) : (
        icon && <Icon name={icon} size={iconSize} />
      )}
      {children}
      {iconEnd && !loading && <Icon name={iconEnd} size={iconSize} />}
    </>
  );

  // Disabled links must not be navigable, so they degrade to a button.
  const isInert = disabled || loading;

  if (to && !isInert) {
    return (
      <Link to={to} className={classes} {...rest}>
        {content}
      </Link>
    );
  }

  if (href && !isInert) {
    return (
      <a href={href} className={classes} {...rest}>
        {content}
      </a>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      disabled={isInert}
      aria-busy={loading || undefined}
      {...rest}
    >
      {content}
    </button>
  );
}

export default Button;
