"use client";

import { createContext, useContext, useState } from "react";

type RequestWidgetContextValue = {
  open: boolean;
  openWidget: () => void;
  closeWidget: () => void;
  toggleWidget: () => void;
};

const RequestWidgetContext = createContext<RequestWidgetContextValue | null>(null);

/**
 * Shared open/closed state for the request panel, so the nav bar button and
 * the floating widget button (mounted separately in the root layout) can
 * both control the same panel instance.
 */
export function RequestWidgetProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <RequestWidgetContext.Provider
      value={{
        open,
        openWidget: () => setOpen(true),
        closeWidget: () => setOpen(false),
        toggleWidget: () => setOpen((value) => !value),
      }}
    >
      {children}
    </RequestWidgetContext.Provider>
  );
}

export function useRequestWidget(): RequestWidgetContextValue {
  const context = useContext(RequestWidgetContext);
  if (!context) {
    throw new Error("useRequestWidget must be used within a RequestWidgetProvider");
  }
  return context;
}
