"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Generic click-to-open nav dropdown — backs the Curriculum, Contact, and
 * Member menus in SiteHeader. Closes on an outside click or Escape, same
 * interaction already used for the mobile menu in that file.
 */
export default function NavDropdown({
  trigger,
  children,
  align = "left",
  panelClassName = "min-w-[180px]",
}: {
  trigger: (open: boolean) => React.ReactNode;
  children: (close: () => void) => React.ReactNode;
  align?: "left" | "right";
  panelClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex items-center gap-1"
      >
        {trigger(open)}
      </button>
      {open && (
        <div
          className={`absolute top-full z-50 mt-2 overflow-hidden rounded-xl border border-ink/10 bg-card py-2 shadow-lg ${
            align === "right" ? "right-0" : "left-0"
          } ${panelClassName}`}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}
