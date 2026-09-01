import { useEffect, useState } from "react";

/**
 * useDebounce — delays a rapidly-changing value.
 *
 * Used by search inputs so filtering (and later, a request per keystroke) does
 * not run on every character.
 */
export function useDebounce(value, delay = 250) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export default useDebounce;
