import { useId, useState } from "react";

import cx from "../../utils/classNames";
import Field from "./Field";
import Icon from "./Icon";

/**
 * Input — 48px square field. Wraps itself in a Field when `label` is provided
 * so forms stay declarative.
 */
function Input({
  label,
  hint,
  error,
  required,
  icon,
  size = "md",
  className,
  wrapperClassName,
  id: idProp,
  type = "text",
  ...rest
}) {
  const autoId = useId();
  const id = idProp || autoId;
  const [revealed, setRevealed] = useState(false);

  const isPassword = type === "password";
  const resolvedType = isPassword && revealed ? "text" : type;

  const control = (
    <div className="input-shell">
      {icon && (
        <span className="input-shell__icon">
          <Icon name={icon} size={16} />
        </span>
      )}

      <input
        id={id}
        type={resolvedType}
        className={cx(
          "input",
          icon && "input--with-icon",
          isPassword && "input--with-action",
          size === "sm" && "input--sm",
          error && "input--invalid",
          className,
        )}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? `${id}-desc` : undefined}
        required={required}
        {...rest}
      />

      {isPassword && (
        <button
          type="button"
          className="input-shell__action"
          onClick={() => setRevealed((v) => !v)}
          aria-label={revealed ? "Hide password" : "Show password"}
          title={revealed ? "Hide password" : "Show password"}
        >
          <Icon name={revealed ? "eyeOff" : "eye"} size={16} />
        </button>
      )}
    </div>
  );

  if (!label && !hint && !error) return control;

  return (
    <Field
      label={label}
      htmlFor={id}
      hint={hint}
      error={error}
      required={required}
      className={wrapperClassName}
    >
      {control}
    </Field>
  );
}

export default Input;
