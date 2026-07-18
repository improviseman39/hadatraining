"use client";

import { useEffect, useState } from "react";
import { formatLocal } from "@/lib/timezone";

/**
 * Renders a UTC ISO timestamp in the viewer's own local timezone. Formats
 * only after mount (not during the client component's SSR pass), since
 * server-side rendering would otherwise use the server process's timezone
 * instead of the browser's — showing "—" briefly rather than a value that
 * would flip on hydration.
 */
export default function LocalDateTime({ value }: { value: string }) {
  const [formatted, setFormatted] = useState<string | null>(null);

  useEffect(() => {
    setFormatted(formatLocal(new Date(value)));
  }, [value]);

  return <>{formatted ?? "—"}</>;
}
