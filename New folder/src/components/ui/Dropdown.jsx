import { useEffect, useRef, useState } from "react";

import cx from "../../utils/classNames";
import Icon from "./Icon";

/**
 * Dropdown — click-triggered menu panel.
 *
 * `trigger` is a render function receiving { open, toggle, ref } so callers can
 * use any control (button, icon button, avatar) without this component
 * dictating the trigger's appearance.
 */
function Dropdown({
  trigger,
  children,
  align = "right",
  wide = false,
  className,
  panelClassName,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };

    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className={cx("dropdown", className)} ref={rootRef}>
      {trigger({ open, toggle: () => setOpen((v) => !v), close })}

      {open && (
        <div
          className={cx(
            "dropdown__panel",
            align === "left" && "dropdown__panel--left",
            wide && "dropdown__panel--wide",
            panelClassName,
          )}
          role="menu"
        >
          {typeof children === "function" ? children({ close }) : children}
        </div>
      )}
    </div>
  );
}

/** Menu row. Renders as a button; pass `as="div"` for non-interactive content. */
export function DropdownItem({
  children,
  icon,
  danger = false,
  selected = false,
  onClick,
  className,
  ...rest
}) {
  return (
    <button
      type="button"
      role="menuitem"
      className={cx(
        "dropdown__item",
        danger && "dropdown__item--danger",
        selected && "is-selected",
        className,
      )}
      onClick={onClick}
      {...rest}
    >
      {icon && <Icon name={icon} size={16} />}
      <span className="grow t-truncate">{children}</span>
      {selected && <Icon name="check" size={14} />}
    </button>
  );
}

export function DropdownLabel({ children }) {
  return <span className="dropdown__label">{children}</span>;
}

export function DropdownSeparator() {
  return <div className="dropdown__sep" role="separator" />;
}

export default Dropdown;
