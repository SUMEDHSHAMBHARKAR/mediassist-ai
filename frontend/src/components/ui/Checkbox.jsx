import cx from "../../utils/classNames";
import Icon from "./Icon";

/** Checkbox — square control with accent fill when checked. */
export function Checkbox({ label, className, ...rest }) {
  return (
    <label className={cx("check", className)}>
      <input type="checkbox" {...rest} />
      <span className="check__box" aria-hidden="true">
        <Icon name="check" size={12} strokeWidth={2.4} />
      </span>
      {label && <span>{label}</span>}
    </label>
  );
}

/** Radio — same control with circular geometry, as a functional exception. */
export function Radio({ label, className, ...rest }) {
  return (
    <label className={cx("check", className)}>
      <input type="radio" {...rest} />
      <span className="check__box check__box--radio" aria-hidden="true">
        <Icon name="check" size={11} strokeWidth={2.6} />
      </span>
      {label && <span>{label}</span>}
    </label>
  );
}

/** Switch — for immediate-effect settings toggles. */
export function Switch({ label, className, ...rest }) {
  return (
    <label className={cx("switch", className)}>
      <input type="checkbox" role="switch" {...rest} />
      <span className="switch__track" aria-hidden="true">
        <span className="switch__thumb" />
      </span>
      {label && <span className="t-data t-strong">{label}</span>}
    </label>
  );
}

export default Checkbox;
