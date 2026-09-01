import { NavLink } from "react-router-dom";

import { navigationForRole } from "../constants/navigation";
import { ROLE_LABELS } from "../constants/roles";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import { useUI } from "../context/UIContext";
import cx from "../utils/classNames";
import Brand from "./Brand";
import Avatar from "./ui/Avatar";
import Icon from "./ui/Icon";
import IconButton from "./ui/IconButton";

/**
 * Sidebar — primary navigation.
 *
 * Static column at desktop; an off-canvas drawer over a scrim below 1024px.
 * Items come from constants/navigation filtered by role, so this component
 * holds no permission logic of its own.
 */
function Sidebar() {
  const { user, role } = useAuth();
  const { navOpen, closeNav, isCompact } = useUI();
  const { unreadCount } = useNotifications();

  const groups = navigationForRole(role);

  return (
    <>
      {isCompact && navOpen && (
        <button
          type="button"
          className="scrim"
          aria-label="Close navigation"
          onClick={closeNav}
        />
      )}

      <nav
        className={cx("sidebar", navOpen && "is-open")}
        aria-label="Primary navigation"
        aria-hidden={isCompact && !navOpen ? true : undefined}
      >
        <div className="sidebar__drawer-head">
          <Brand />
          <IconButton icon="close" label="Close navigation" onClick={closeNav} />
        </div>

        <div className="sidebar__scroll">
          {groups.map((group) => (
            <div className="sidebar__group" key={group.id}>
              {group.label && (
                <span className="sidebar__group-label">{group.label}</span>
              )}

              <ul>
                {group.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        cx("nav-item", isActive && "is-active")
                      }
                      onClick={isCompact ? closeNav : undefined}
                    >
                      <span className="nav-item__icon">
                        <Icon name={item.icon} size={17} />
                      </span>
                      <span className="nav-item__label">{item.label}</span>

                      {item.to === "/notifications" && unreadCount > 0 && (
                        <span className="nav-item__count">{unreadCount}</span>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {user && (
          <div className="sidebar__footer">
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                cx("row row--loose", isActive && "t-ink")
              }
            >
              <Avatar name={user.name} size="sm" accent />
              <span className="grow col col--gap-xxs" style={{ minWidth: 0 }}>
                <span className="identity__name">{user.name}</span>
                <span className="identity__meta">{ROLE_LABELS[role]}</span>
              </span>
              <Icon name="settings" size={15} className="t-muted" />
            </NavLink>
          </div>
        )}
      </nav>
    </>
  );
}

export default Sidebar;
