"use client";

import { useCallback, useEffect, useState } from "react";

/** Tracks an expand/collapse (fullscreen overlay) state: Escape-to-close + body scroll lock while expanded. */
export function useExpandable() {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!expanded) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setExpanded(false);
    }
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [expanded]);

  const toggle = useCallback(() => setExpanded((value) => !value), []);
  const collapse = useCallback(() => setExpanded(false), []);

  return { expanded, toggle, collapse };
}
