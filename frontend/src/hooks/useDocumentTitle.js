import { useEffect } from "react";

const SUFFIX = "MediAssist AI";

/** Keeps the browser tab title in step with the current screen. */
export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · ${SUFFIX}` : SUFFIX;
  }, [title]);
}

export default useDocumentTitle;
