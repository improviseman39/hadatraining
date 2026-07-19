"use client";

import { useRouter } from "next/navigation";
import { useUnsavedChanges } from "@/components/admin/UnsavedChangesContext";

export default function BackToSessionsLink() {
  const router = useRouter();
  const unsaved = useUnsavedChanges();

  return (
    <a
      href="/admin/sessions"
      onClick={(event) => {
        event.preventDefault();
        if (unsaved?.confirmNavigation() ?? true) router.push("/admin/sessions");
      }}
      className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-teal"
    >
      &larr; Back to sessions
    </a>
  );
}
