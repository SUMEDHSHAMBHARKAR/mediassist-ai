import cx from "../../utils/classNames";
import Icon from "./Icon";

/**
 * Tabs — text-only labels with a 2px underline on the active item, matching the
 * design system's category-tab pattern. Purely presentational: the caller owns
 * the active value.
 *
 * items: [{ value, label, count?, icon? }]
 */
function Tabs({ items, value, onChange, size = "md", className }) {
  return (
    <div className={cx("tabs", size === "sm" && "tabs--sm", className)} role="tablist">
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          role="tab"
          aria-selected={value === item.value}
          className={cx("tab", value === item.value && "is-active")}
          onClick={() => onChange(item.value)}
        >
          {item.icon && <Icon name={item.icon} size={14} />}
          {item.label}
          {item.count !== undefined && item.count !== null && (
            <span className="tab__count">{item.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

/** Segmented control — compact view switcher (list/grid, day/week). */
export function Segmented({ items, value, onChange, className }) {
  return (
    <div className={cx("segment", className)} role="group">
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          className={cx("segment__btn", value === item.value && "is-active")}
          onClick={() => onChange(item.value)}
          aria-pressed={value === item.value}
          title={item.label}
        >
          {item.icon && <Icon name={item.icon} size={14} />}
          {item.label}
        </button>
      ))}
    </div>
  );
}

export default Tabs;
