"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

/**
 * Replaces the plain `<form action={boundServerAction}>` pattern. That
 * pattern is supposed to auto-refresh the current route after the action
 * completes, but in practice left admin lists showing stale data (a
 * deleted row stayed visible) until a manual page reload. Calling
 * router.refresh() explicitly after the action resolves guarantees the
 * current page re-fetches, regardless of why the automatic refresh wasn't
 * firing.
 */
export default function ActionButton({
  action,
  confirmMessage,
  children,
  className,
  ariaLabel,
  disabled,
}: {
  action: () => Promise<unknown>;
  confirmMessage?: string;
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled || pending}
      className={className}
      onClick={() => {
        if (confirmMessage && !window.confirm(confirmMessage)) return;
        startTransition(async () => {
          await action();
          router.refresh();
        });
      }}
    >
      {children}
    </button>
  );
}
