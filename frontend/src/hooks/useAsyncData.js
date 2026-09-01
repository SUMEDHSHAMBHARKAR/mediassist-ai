import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useAsyncData — runs a service call and exposes { data, loading, error, reload }.
 *
 * This is the only place pages touch async lifecycle, so every list and detail
 * screen gets the same loading/error semantics. Results from a stale call are
 * discarded, so switching records quickly cannot paint the wrong data.
 *
 * @param loader  () => Promise<T>   the service call
 * @param deps    unknown[]          re-runs when these change
 */
export function useAsyncData(loader, deps = [], { enabled = true, initialData = null } = {}) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);

  // Incremented on every run; only the newest run may commit state.
  const runIdRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const run = useCallback(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    const runId = runIdRef.current + 1;
    runIdRef.current = runId;

    setLoading(true);
    setError(null);

    Promise.resolve()
      .then(loader)
      .then((result) => {
        if (!mountedRef.current || runIdRef.current !== runId) return;
        setData(result);
        setLoading(false);
      })
      .catch((cause) => {
        if (!mountedRef.current || runIdRef.current !== runId) return;
        setError(cause instanceof Error ? cause : new Error(String(cause)));
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  useEffect(() => {
    run();
  }, [run]);

  return { data, loading, error, reload: run, setData };
}

export default useAsyncData;
