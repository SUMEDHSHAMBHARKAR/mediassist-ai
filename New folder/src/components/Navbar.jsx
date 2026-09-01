import { useUI } from "../context/UIContext";
import Brand from "./Brand";
import GlobalSearch from "./GlobalSearch";
import NotificationMenu from "./NotificationMenu";
import UserMenu from "./UserMenu";
import Button from "./ui/Button";
import IconButton from "./ui/IconButton";

/**
 * Navbar — 64px black bar across the top of the application.
 *
 * Left: drawer toggle (compact only) and brand. Centre: global search.
 * Right: AI entry point, notifications, account.
 */
function Navbar() {
  const { toggleNav, navOpen } = useUI();

  return (
    <header className="navbar">
      <div className="navbar__lead">
        <span className="only-tablet">
          <IconButton
            icon="menu"
            label="Open navigation"
            onClick={toggleNav}
            aria-expanded={navOpen}
          />
        </span>

        <Brand />
      </div>

      <div className="navbar__spacer" />

      <GlobalSearch />

      <div className="navbar__cluster">
        <span className="hide-mobile">
          <Button variant="ghost" icon="ai" to="/ai" size="sm">
            Assistant
          </Button>
        </span>

        <span className="only-mobile">
          <IconButton icon="ai" label="AI assistant" to="/ai" />
        </span>

        <NotificationMenu />

        <span className="navbar__divider hide-mobile" aria-hidden="true" />

        <UserMenu />
      </div>
    </header>
  );
}

export default Navbar;
