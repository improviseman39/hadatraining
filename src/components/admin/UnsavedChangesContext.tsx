"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type ContextValue = {
  isDirty: boolean;
  setDirty: (key: string, dirty: boolean) => void;
  /** Shows a confirm() prompt if there are unsaved changes; returns true if it's safe to proceed. */
  confirmNavigation: () => boolean;
};

const UnsavedChangesContext = createContext<ContextValue | null>(null);

const WARNING = "You have unsaved changes on this page. Leave anyway?";

export function UnsavedChangesProvider({ children }: { children: React.ReactNode }) {
  const dirtyKeys = useRef(new Set<string>());
  const [isDirty, setIsDirty] = useState(false);

  const setDirty = useCallback((key: string, dirty: boolean) => {
    if (dirty) dirtyKeys.current.add(key);
    else dirtyKeys.current.delete(key);
    setIsDirty(dirtyKeys.current.size > 0);
  }, []);

  const confirmNavigation = useCallback(() => {
    if (dirtyKeys.current.size === 0) return true;
    return window.confirm(WARNING);
  }, []);

  useEffect(() => {
    if (!isDirty) return;
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  return (
    <UnsavedChangesContext.Provider value={{ isDirty, setDirty, confirmNavigation }}>
      {children}
    </UnsavedChangesContext.Provider>
  );
}

export function useUnsavedChanges() {
  return useContext(UnsavedChangesContext);
}
