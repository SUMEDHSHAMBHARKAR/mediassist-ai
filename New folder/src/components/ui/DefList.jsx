import cx from "../../utils/classNames";
import Icon from "./Icon";

/**
 * DefList — label/value grid used on every detail page instead of a
 * single-record table.
 *
 * items: [{ label, value, span?: boolean }]  — falsy values render as an em dash
 * via the caller's formatter, so absent fields still occupy the grid.
 */
function DefList({ items, columns = "auto", className }) {
  return (
    <dl
      className={cx("deflist", columns === 1 && "deflist--single", className)}
      style={
        typeof columns === "number" && columns > 1
          ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }
          : undefined
      }
    >
      {items.map((item) => (
        <div
          className="deflist__item"
          key={item.label}
          style={item.span ? { gridColumn: "1 / -1" } : undefined}
        >
          <dt className="deflist__label">{item.label}</dt>
          <dd className="deflist__value">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** MetaRow — inline dot-separated metadata. items: [{ icon?, text }] */
export function MetaRow({ items, className }) {
  const visible = items.filter(Boolean);

  return (
    <div className={cx("meta", className)}>
      {visible.map((item, index) => (
        <span className="row row--tight" key={`${item.text}-${index}`}>
          <span className="meta__item">
            {item.icon && <Icon name={item.icon} size={13} />}
            {item.text}
          </span>
          {index < visible.length - 1 && (
            <span className="meta__sep" aria-hidden="true" />
          )}
        </span>
      ))}
    </div>
  );
}

export default DefList;
