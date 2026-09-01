import cx from "../../utils/classNames";
import Icon from "./Icon";

/**
 * SearchInput — controlled search field with a clear affordance.
 * Debouncing is the caller's concern (see hooks/useDebounce).
 */
function SearchInput({
  value,
  onChange,
  placeholder = "Search",
  label = "Search",
  size = "md",
  className,
  ...rest
}) {
  return (
    <div className={cx("input-shell", className)}>
      <span className="input-shell__icon">
        <Icon name="search" size={16} />
      </span>

      <input
        type="search"
        className={cx(
          "input",
          "input--with-icon",
          value && "input--with-action",
          size === "sm" && "input--sm",
        )}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        {...rest}
      />

      {value && (
        <button
          type="button"
          className="input-shell__action"
          onClick={() => onChange("")}
          aria-label="Clear search"
          title="Clear search"
        >
          <Icon name="close" size={14} />
        </button>
      )}
    </div>
  );
}

export default SearchInput;
