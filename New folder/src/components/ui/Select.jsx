import { useId } from "react";

import cx from "../../utils/classNames";
import Field from "./Field";
import Icon from "./Icon";

/**
 * Select — native select with system chevron. Options are passed as
 * [{ value, label }] so filter bars can be driven from constants.
 */
function Select({
  label,
  hint,
  error,
  required,
  options = [],
  placeholder,
  size = "md",
  className,
  wrapperClassName,
  id: idProp,
  ...rest
}) {
  const autoId = useId();
  const id = idProp || autoId;

  const control = (
    <div className={cx("select-shell", wrapperClassName)}>
      <select
        id={id}
        className={cx(
          "select",
          size === "sm" && "select--sm",
          error && "input--invalid",
          className,
        )}
        aria-invalid={error ? true : undefined}
        required={required}
        {...rest}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) =>
          typeof opt === "string" ? (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ) : (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ),
        )}
      </select>

      <span className="select-shell__chevron">
        <Icon name="chevronDown" size={15} />
      </span>
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
    >
      {control}
    </Field>
  );
}

export default Select;
