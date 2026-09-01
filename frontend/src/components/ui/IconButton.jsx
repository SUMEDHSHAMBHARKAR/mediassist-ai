import { Link } from "react-router-dom";

import cx from "../../utils/classNames";
import Icon from "./Icon";

/**
 * IconButton — circular icon-only control. The only round geometry in the
 * system. `label` is required because the control has no visible text.
 */
function IconButton({
  icon,
  label,
  variant = "plain",
  size = "md",
  active = false,
  badge = false,
  to,
  className,
  type = "button",
  ...rest
}) {
  const classes = cx(
    "icon-btn",
    variant !== "plain" && `icon-btn--${variant}`,
    size === "sm" && "icon-btn--sm",
    active && "icon-btn--is-active",
    className,
  );

  const glyph = <Icon name={icon} size={size === "sm" ? 16 : 18} />;

  const control = to ? (
    <Link to={to} className={classes} aria-label={label} title={label} {...rest}>
      {glyph}
    </Link>
  ) : (
    <button
      type={type}
      className={classes}
      aria-label={label}
      title={label}
      {...rest}
    >
      {glyph}
    </button>
  );

  if (!badge) return control;

  return (
    <span className="icon-btn-wrap">
      {control}
      <span className="icon-btn__dot" aria-hidden="true" />
    </span>
  );
}

export default IconButton;
