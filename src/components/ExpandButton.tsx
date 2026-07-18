"use client";

export default function ExpandButton({
  expanded,
  onClick,
  label,
}: {
  expanded: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={expanded ? `Exit fullscreen — ${label}` : `Expand ${label} to fullscreen`}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-porcelain/30 bg-ink/40 text-porcelain backdrop-blur-sm transition-colors hover:border-teal hover:text-teal"
    >
      {expanded ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M9 4v4a1 1 0 01-1 1H4M20 9h-4a1 1 0 01-1-1V4M15 20v-4a1 1 0 011-1h4M4 15h4a1 1 0 011 1v4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M4 9V5a1 1 0 011-1h4M20 9V5a1 1 0 00-1-1h-4M4 15v4a1 1 0 001 1h4M20 15v4a1 1 0 01-1 1h-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}
