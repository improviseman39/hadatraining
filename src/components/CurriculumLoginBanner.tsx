"use client";

import { useAuth } from "@/context/AuthContext";

export default function CurriculumLoginBanner() {
  const { isMember, isReady } = useAuth();

  if (!isReady || isMember) return null;

  return (
    <div className="flex items-center gap-2 self-start rounded-full border border-terracotta/30 bg-terracotta/5 px-4 py-2 text-xs font-medium text-terracotta sm:self-auto">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="2" />
        <path d="M8 11V7a4 4 0 018 0v4" stroke="currentColor" strokeWidth="2" />
      </svg>
      Please log in or register to see all sessions
    </div>
  );
}
