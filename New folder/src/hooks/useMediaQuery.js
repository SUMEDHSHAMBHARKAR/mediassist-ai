import { useEffect, useState } from "react";

/**
 * useMediaQuery — subscribes to a CSS media query.
 *
 * Layout itself is handled in CSS; this is only for behaviour that cannot be
 * expressed there, such as closing the mobile navigation drawer when the
 * viewport grows past the breakpoint.
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia(query).matches,
  );

  useEffect(() => {
    const list = window.matchMedia(query);
    const onChange = (event) => setMatches(event.matches);

    setMatches(list.matches);
    list.addEventListener("change", onChange);

    return () => list.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

/** True at the tablet breakpoint and below, where the sidebar becomes a drawer. */
export function useIsCompact() {
  return useMediaQuery("(max-width: 1023px)");
}

export default useMediaQuery;
