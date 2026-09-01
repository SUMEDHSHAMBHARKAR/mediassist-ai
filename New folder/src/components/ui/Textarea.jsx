import { useId } from "react";

import cx from "../../utils/classNames";
import Field from "./Field";

function Textarea({
  label,
  hint,
  error,
  required,
  rows = 4,
  className,
  id: idProp,
  ...rest
}) {
  const autoId = useId();
  const id = idProp || autoId;

  const control = (
    <textarea
      id={id}
      rows={rows}
      className={cx(
        "input",
        "input--textarea",
        error && "input--invalid",
        className,
      )}
      aria-invalid={error ? true : undefined}
      required={required}
      {...rest}
    />
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

export default Textarea;
