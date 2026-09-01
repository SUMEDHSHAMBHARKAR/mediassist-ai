import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import cx from "../../utils/classNames";
import IconButton from "./IconButton";

/**
 * Modal — portalled dialog with scrim, Escape-to-close, scroll lock and focus
 * containment. Renders nothing when closed so unmounted forms reset naturally.
 */
function Modal({
  open,
  onClose,
  title,
  subtitle,
  size = "md",
  footer,
  children,
  closeOnScrim = true,
  className,
}) {
  const panelRef = useRef(null);
  const restoreFocusRef = useRef(null);

  // Escape closes; body scroll is locked while a dialog owns the viewport.
  useEffect(() => {
    if (!open) return undefined;

    restoreFocusRef.current = document.activeElement;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose?.();
        return;
      }

      if (event.key !== "Tab") return;

      const focusables = panelRef.current?.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables || focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Move focus into the dialog once it has painted.
    const focusTimer = window.setTimeout(() => {
      const target = panelRef.current?.querySelector(
        'input:not([type="hidden"]):not([disabled]), textarea, select, button',
      );
      (target || panelRef.current)?.focus();
    }, 0);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(focusTimer);
      restoreFocusRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="modal-scrim"
      onMouseDown={(event) => {
        if (closeOnScrim && event.target === event.currentTarget) onClose?.();
      }}
    >
      <div
        ref={panelRef}
        className={cx("modal", size !== "md" && `modal--${size}`, className)}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
        tabIndex={-1}
      >
        {title && (
          <header className="modal__head">
            <div>
              <h2 className="modal__title">{title}</h2>
              {subtitle && <p className="modal__subtitle">{subtitle}</p>}
            </div>
            <IconButton
              icon="close"
              label="Close dialog"
              size="sm"
              onClick={onClose}
            />
          </header>
        )}

        <div className="modal__body">{children}</div>

        {footer && <footer className="modal__foot">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}

export default Modal;
