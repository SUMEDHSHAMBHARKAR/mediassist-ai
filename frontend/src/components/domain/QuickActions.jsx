import { Link } from "react-router-dom";

import cx from "../../utils/classNames";
import Icon from "../ui/Icon";

/**
 * QuickActions — grid of primary task entry points for dashboards.
 * actions: [{ label, sub, icon, to, onClick }]
 */
function QuickActions({ actions, columns = 2, className }) {
  return (
    <div
      className={cx("grid", "grid--tight", className)}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {actions.map((action) => {
        const content = (
          <>
            <span className="tile__icon" aria-hidden="true">
              <Icon name={action.icon} size={18} />
            </span>
            <span className="tile__text">
              <span className="tile__title">{action.label}</span>
              {action.sub && <span className="tile__sub">{action.sub}</span>}
            </span>
          </>
        );

        return action.to ? (
          <Link className="tile" to={action.to} key={action.label}>
            {content}
          </Link>
        ) : (
          <button
            type="button"
            className="tile"
            onClick={action.onClick}
            key={action.label}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}

export default QuickActions;
