import { useNavigate } from "react-router-dom";

import { ROLES, ROLE_ICONS, ROLE_LABELS } from "../constants/roles";
import { useAuth } from "../context/AuthContext";
import Avatar from "./ui/Avatar";
import Dropdown, {
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
} from "./ui/Dropdown";
import Icon from "./ui/Icon";

/**
 * UserMenu — account cluster in the navbar.
 *
 * Includes a role switcher. That is a review affordance for the mocked auth
 * layer, not a product feature: once /auth/login is wired up, the role comes
 * from the session and this section is removed.
 */
function UserMenu() {
  const { user, role, signOut, switchRole } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <Dropdown
      trigger={({ toggle, open }) => (
        <button
          type="button"
          className="row row--tight"
          onClick={toggle}
          aria-expanded={open}
          aria-label="Account menu"
          style={{ padding: "4px 6px 4px 4px" }}
        >
          <Avatar name={user.name} size="sm" accent />
          <span className="col hide-mobile" style={{ alignItems: "flex-start" }}>
            <span className="identity__name">{user.name}</span>
            <span className="identity__meta">{ROLE_LABELS[role]}</span>
          </span>
          <Icon name="chevronDown" size={14} className="t-muted" />
        </button>
      )}
    >
      {({ close }) => (
        <>
          <div className="dropdown__head">
            <div className="row row--loose">
              <Avatar name={user.name} accent />
              <div className="col col--gap-xxs" style={{ minWidth: 0 }}>
                <span className="t-data t-ink t-truncate">{user.name}</span>
                <span className="t-caption t-truncate">{user.email}</span>
              </div>
            </div>
          </div>

          <DropdownItem
            icon="user"
            onClick={() => {
              close();
              navigate("/settings");
            }}
          >
            Profile and preferences
          </DropdownItem>

          <DropdownItem
            icon="notifications"
            onClick={() => {
              close();
              navigate("/notifications");
            }}
          >
            Notification centre
          </DropdownItem>

          <DropdownSeparator />

          <DropdownLabel>View as (demo)</DropdownLabel>
          {Object.values(ROLES).map((value) => (
            <DropdownItem
              key={value}
              icon={ROLE_ICONS[value]}
              selected={role === value}
              onClick={() => {
                switchRole(value);
                close();
                navigate("/dashboard");
              }}
            >
              {ROLE_LABELS[value]}
            </DropdownItem>
          ))}

          <DropdownSeparator />

          <DropdownItem
            icon="logout"
            danger
            onClick={async () => {
              close();
              await signOut();
              navigate("/login");
            }}
          >
            Sign out
          </DropdownItem>
        </>
      )}
    </Dropdown>
  );
}

export default UserMenu;
