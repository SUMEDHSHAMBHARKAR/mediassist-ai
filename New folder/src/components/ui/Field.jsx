import cx from "../../utils/classNames";
import Icon from "./Icon";

/**
 * Field — label + control + hint/error wrapper.
 *
 * Children receive nothing automatically; call sites pass the control and the
 * matching `id`. Keeping the wiring explicit avoids cloneElement guesswork.
 */
function Field({
  label,
  htmlFor,
  hint,
  error,
  required = false,
  children,
  className,
}) {
  return (
    <div className={cx("field", className)}>
      {label && (
        <label className="field__label" htmlFor={htmlFor}>
          {label}
          {required && (
            <span className="field__required" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      {children}

      {error ? (
        <span className="field__error" role="alert">
          <Icon name="alertCircle" size={13} />
          {error}
        </span>
      ) : (
        hint && <span className="field__hint">{hint}</span>
      )}
    </div>
  );
}

export default Field;
