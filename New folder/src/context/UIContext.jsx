import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

import { useIsCompact } from "../hooks/useMediaQuery";

/**
 * UIContext — shell-level UI state that more than one component needs:
 * the mobile navigation drawer and the global search palette.
 */
const UIContext = createContext(null);

export function UIProvider({ children }) {
  const [navOpen, setNavOpen] = useState(false);
  const isCompact = useIsCompact();
  const location = useLocation();

  // Navigating closes the drawer, otherwise it stays open over the new page.
  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  // Growing past the breakpoint reveals the static sidebar, so the drawer state
  // must be cleared or the scrim would linger.
  useEffect(() => {
    if (!isCompact) setNavOpen(false);
  }, [isCompact]);

  // The drawer overlays content, so body scroll is locked while it is open.
  useEffect(() => {
    if (!navOpen) return undefined;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, [navOpen]);

  const value = useMemo(
    () => ({
      navOpen,
      isCompact,
      openNav: () => setNavOpen(true),
      closeNav: () => setNavOpen(false),
      toggleNav: () => setNavOpen((open) => !open),
    }),
    [navOpen, isCompact],
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const context = useContext(UIContext);

  if (!context) {
    throw new Error("useUI must be used inside a UIProvider.");
  }

  return context;
}

export default UIContext;
