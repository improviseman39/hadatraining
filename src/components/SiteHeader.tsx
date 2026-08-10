"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useRequestWidget } from "@/context/RequestWidgetContext";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import SiteSearch from "@/components/SiteSearch";

export default function SiteHeader({
  headerTitle,
  headerSubtitle,
  logoUrl,
}: {
  headerTitle: string;
  headerSubtitle: string;
  logoUrl: string | null;
}) {
  const { isMember, isReady, role, logout } = useAuth();
  const { openWidget } = useRequestWidget();
  const isStaff = role === "admin" || role === "super_admin";
  const pathname = usePathname();
  const onSessionPage = pathname?.startsWith("/sessions/") ?? false;
  const [newRequestCount, setNewRequestCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!isStaff) {
      setNewRequestCount(0);
      return;
    }
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "new")
      .then(({ count }) => {
        if (!cancelled) setNewRequestCount(count ?? 0);
      });
    return () => {
      cancelled = true;
    };
  }, [isStaff, pathname]);

  // Menu content depends on auth state (isReady flips after mount), so close
  // any open mobile menu whenever the route or auth state changes underneath it.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname, isMember, isStaff]);

  useEffect(() => {
    if (!menuOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  function handleContactClick() {
    setMenuOpen(false);
    openWidget();
  }

  function handleLogoutClick() {
    setMenuOpen(false);
    logout();
  }

  return (
    <header className="border-b border-ink/10 bg-porcelain/95 backdrop-blur supports-[backdrop-filter]:bg-porcelain/80 sticky top-0 z-40">
      <div className="container-page flex h-16 items-center justify-between sm:h-20">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2"
            onClick={() => setMenuOpen(false)}
          >
            {logoUrl ? (
              <span className="relative block h-9 w-auto">
                <Image
                  src={logoUrl}
                  alt={headerTitle}
                  height={36}
                  width={140}
                  unoptimized
                  className="h-9 w-auto object-contain"
                />
              </span>
            ) : (
              <span className="flex items-baseline gap-2 font-serif text-lg font-semibold tracking-tight text-ink sm:text-xl">
                <span>{headerTitle}</span>
                <span className="hidden text-sm font-normal tracking-wide text-muted sm:inline">
                  {headerSubtitle}
                </span>
              </span>
            )}
          </Link>

          {onSessionPage && (
            <Link
              href="/#curriculum"
              aria-label="Back to curriculum"
              className="flex items-center gap-1.5 rounded-full border border-ink/15 px-2.5 py-1.5 text-xs font-medium text-ink/80 transition-colors hover:border-teal hover:text-teal sm:px-3"
            >
              <span aria-hidden="true">&larr;</span>
              <span className="hidden sm:inline">Back to curriculum</span>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-1 sm:gap-2 lg:gap-5">
          {/* Full nav — only once there's room for every item on one line */}
          <nav className="hidden items-center gap-5 text-sm lg:flex">
            <Link
              href="/#curriculum"
              className="text-ink/80 transition-colors hover:text-teal"
            >
              Curriculum
            </Link>
            <Link
              href="/#updates"
              className="text-ink/80 transition-colors hover:text-teal"
            >
              Updates
            </Link>
            <Link
              href="/qa"
              className="text-ink/80 transition-colors hover:text-teal"
            >
              Q&amp;A
            </Link>
          </nav>

          <SiteSearch />

          {/* Full-nav member/CTA controls — desktop only, hidden below lg */}
          <div className="hidden items-center gap-3 lg:flex">
            {isReady && isMember ? (
              <>
                <Link
                  href="/timetable"
                  className="rounded-full border border-ink/15 px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-teal hover:text-teal"
                >
                  Timetable
                </Link>
                <button
                  type="button"
                  onClick={openWidget}
                  className="rounded-full border border-ink/15 px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-teal hover:text-teal"
                >
                  Contact us
                </button>
                {isStaff && (
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-1.5 rounded-full border border-teal/30 px-3 py-1.5 text-xs font-medium text-teal-dark transition-colors hover:border-teal"
                  >
                    Admin
                    {newRequestCount > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-terracotta px-1.5 text-xs font-semibold text-porcelain">
                        {newRequestCount}
                      </span>
                    )}
                  </Link>
                )}
                <span className="flex items-center gap-1.5 rounded-full bg-teal/10 px-3 py-1.5 text-xs font-medium text-teal-dark">
                  <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-teal" />
                  Member
                </span>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-full border border-ink/15 px-4 py-2 font-medium text-ink transition-colors hover:border-terracotta hover:text-terracotta"
                >
                  Log out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-full bg-teal px-4 py-2 font-medium text-porcelain transition-colors hover:bg-teal-dark"
              >
                Log in
              </Link>
            )}
          </div>

          {/* Compact controls — phones and tablets, anywhere the full nav wouldn't fit */}
          <div className="flex items-center gap-1 lg:hidden">
            {!(isReady && isMember) && (
              <Link
                href="/login"
                className="rounded-full bg-teal px-4 py-2 text-sm font-medium text-porcelain transition-colors hover:bg-teal-dark"
              >
                Log in
              </Link>
            )}
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              className="flex h-9 w-9 items-center justify-center rounded-full text-ink/80 transition-colors hover:bg-ink/5 hover:text-teal"
            >
              {menuOpen ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <nav
          aria-label="Mobile"
          className="border-t border-ink/10 bg-porcelain px-6 py-4 shadow-lg lg:hidden"
        >
          <div className="flex flex-col gap-1 text-base">
            <Link
              href="/#curriculum"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-3 py-2.5 text-ink/80 transition-colors hover:bg-ink/5 hover:text-teal"
            >
              Curriculum
            </Link>
            <Link
              href="/#updates"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-3 py-2.5 text-ink/80 transition-colors hover:bg-ink/5 hover:text-teal"
            >
              Updates
            </Link>
            <Link
              href="/qa"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-3 py-2.5 text-ink/80 transition-colors hover:bg-ink/5 hover:text-teal"
            >
              Q&amp;A
            </Link>

            {isReady && isMember && (
              <>
                <Link
                  href="/timetable"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-ink/80 transition-colors hover:bg-ink/5 hover:text-teal"
                >
                  Timetable
                </Link>
                <button
                  type="button"
                  onClick={handleContactClick}
                  className="rounded-lg px-3 py-2.5 text-left text-ink/80 transition-colors hover:bg-ink/5 hover:text-teal"
                >
                  Contact us
                </button>
                {isStaff && (
                  <Link
                    href="/admin"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-teal-dark transition-colors hover:bg-teal/10"
                  >
                    Admin
                    {newRequestCount > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-terracotta px-1.5 text-xs font-semibold text-porcelain">
                        {newRequestCount}
                      </span>
                    )}
                  </Link>
                )}
                <div className="mt-2 flex items-center justify-between border-t border-ink/10 pt-3">
                  <span className="flex items-center gap-1.5 rounded-full bg-teal/10 px-3 py-1.5 text-xs font-medium text-teal-dark">
                    <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-teal" />
                    Member
                  </span>
                  <button
                    type="button"
                    onClick={handleLogoutClick}
                    className="rounded-full border border-ink/15 px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-terracotta hover:text-terracotta"
                  >
                    Log out
                  </button>
                </div>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
