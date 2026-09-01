import { Link } from "react-router-dom";

import cx from "../../utils/classNames";
import Icon from "./Icon";

/**
 * Breadcrumb — uppercase trail. items: [{ label, to? }]
 * The final item is always rendered as current, never as a link.
 */
function Breadcrumb({ items, className }) {
  return (
    <nav className={cx("breadcrumb", className)} aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span className="row row--tight" key={`${item.label}-${index}`}>
            <span
              className="breadcrumb__item"
              aria-current={isLast ? "page" : undefined}
            >
              {item.to && !isLast ? <Link to={item.to}>{item.label}</Link> : item.label}
            </span>

            {!isLast && (
              <span className="breadcrumb__sep" aria-hidden="true">
                <Icon name="chevronRight" size={11} />
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}

export default Breadcrumb;
