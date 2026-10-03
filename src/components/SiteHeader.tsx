"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useRequestWidget } from "@/context/RequestWidgetContext";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import SiteSearch from "@/components/SiteSearch";
import NavDropdown from "@/components/NavDropdown";
import { categoryOrder } from "@/data/sessions";

const ChevronDown = ({ open }: { open: boolean }) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
  >
    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PersonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
    <path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export default function SiteHeader({
  headerTitle,
  headerSubtitle,
  logoUrl,
}: {
  headerTitle: string;
  headerSubtitle: string;
  logoUrl: string | null;
}) {
  const { user, isMember, isReady, role, logout } = useAuth();
  const { openWidget } = useRequestWidget();
  const isStaff = role === "admin" || role === "super_admin";
  const pathname = usePathname();
  const onSessionPage = pathname?.startsWith("/sessions/") ?? false;
  const [newRequestCount, setNewRequestCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  const fullName = (user?.user_metadata?.full_name as string | undefined) ?? null;

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
              href="/curriculum"
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
            <NavDropdown
              trigger={(open) => (
                <span className="flex items-center gap-1 text-ink/80 transition-colors hover:text-teal">
                  Curriculum
                  <ChevronDown open={open} />
                </span>
              )}
            >
              {(close) => (
                <>
                  {categoryOrder.map((category) => (
                    <Link
                      key={category}
                      href={`/curriculum?category=${encodeURIComponent(category)}`}
                      onClick={close}
                      className="block px-4 py-2 text-sm text-ink/80 transition-colors hover:bg-ink/5 hover:text-teal"
                    >
                      {category}
                    </Link>
                  ))}
                </>
              )}
            </NavDropdown>

            <Link
              href="/#updates"
              className="text-ink/80 transition-colors hover:text-teal"
            >
              Updates
            </Link>

            <NavDropdown
              trigger={(open) => (
                <span className="flex items-center gap-1 text-ink/80 transition-colors hover:text-teal">
                  Contact
                  <ChevronDown open={open} />
                </span>
              )}
            >
              {(close) => (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      close();
                      openWidget();
                    }}
                    className="block w-full px-4 py-2 text-left text-sm text-ink/80 transition-colors hover:bg-ink/5 hover:text-teal"
                  >
                    Contact Us
                  </button>
                  <Link
                    href="/#faq"
                    onClick={close}
                    className="block px-4 py-2 text-sm text-ink/80 transition-colors hover:bg-ink/5 hover:text-teal"
                  >
                    FAQ
                  </Link>
                  <Link
                    href="/qa"
                    onClick={close}
                    className="block px-4 py-2 text-sm text-ink/80 transition-colors hover:bg-ink/5 hover:text-teal"
                  >
                    Q&amp;A
                  </Link>
                </>
              )}
            </NavDropdown>

            <Link
              href="/timetable"
              className="text-ink/80 transition-colors hover:text-teal"
            >
              Booking
            </Link>
          </nav>

          <SiteSearch />

          {/* Full-nav member/CTA controls — desktop only, hidden below lg */}
          <div className="hidden items-center lg:flex">
            {isReady && isMember ? (
              <NavDropdown
                align="right"
                panelClassName="w-72"
                trigger={(open) => (
                  <span className="flex items-center gap-2 rounded-full border border-ink/15 bg-card py-1.5 pl-1.5 pr-3 text-sm font-medium text-ink transition-colors hover:border-teal">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink/5 text-ink/60">
                      <PersonIcon />
                    </span>
                    Member
                    <ChevronDown open={open} />
                  </span>
                )}
              >
                {(close) => (
                  <>
                    <div className="flex items-center gap-3 border-b border-ink/10 px-4 pb-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink/5 text-ink/60">
                        <PersonIcon />
                      </span>
                      <div className="min-w-0">
                        {fullName && (
                          <p className="truncate text-sm font-medium text-ink">{fullName}</p>
                        )}
                        <p className="truncate text-xs text-muted">{user?.email}</p>
                      </div>
                    </div>
                    <div className="pt-1">
                      <Link
                        href="/timetable"
                        onClick={close}
                        className="block px-4 py-2 text-sm text-ink/80 transition-colors hover:bg-ink/5 hover:text-teal"
                      >
                        Timetable
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          close();
                          openWidget();
                        }}
                        className="block w-full px-4 py-2 text-left text-sm text-ink/80 transition-colors hover:bg-ink/5 hover:text-teal"
                      >
                        Contact us
                      </button>
                      {isStaff && (
                        <Link
                          href="/admin"
                          onClick={close}
                          className="flex items-center gap-1.5 px-4 py-2 text-sm text-teal-dark transition-colors hover:bg-teal/10"
                        >
                          Admin
                          {newRequestCount > 0 && (
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-terracotta px-1.5 text-xs font-semibold text-porcelain">
                              {newRequestCount}
                            </span>
                          )}
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          close();
                          logout();
                        }}
                        className="block w-full border-t border-ink/10 px-4 py-2 text-left text-sm text-ink/80 transition-colors hover:bg-ink/5 hover:text-terracotta"
                      >
                        Log out
                      </button>
                    </div>
                  </>
                )}
              </NavDropdown>
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
            <p className="mt-1 px-3 text-xs font-medium uppercase tracking-wide text-muted">
              Curriculum
            </p>
            {categoryOrder.map((category) => (
              <Link
                key={category}
                href={`/curriculum?category=${encodeURIComponent(category)}`}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 text-ink/80 transition-colors hover:bg-ink/5 hover:text-teal"
              >
                {category}
              </Link>
            ))}

            <Link
              href="/#updates"
              onClick={() => setMenuOpen(false)}
              className="mt-2 rounded-lg px-3 py-2.5 text-ink/80 transition-colors hover:bg-ink/5 hover:text-teal"
            >
              Updates
            </Link>
            <Link
              href="/#faq"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-3 py-2.5 text-ink/80 transition-colors hover:bg-ink/5 hover:text-teal"
            >
              FAQ
            </Link>
            <Link
              href="/qa"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-3 py-2.5 text-ink/80 transition-colors hover:bg-ink/5 hover:text-teal"
            >
              Q&amp;A
            </Link>
            <Link
              href="/timetable"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-3 py-2.5 text-ink/80 transition-colors hover:bg-ink/5 hover:text-teal"
            >
              Booking
            </Link>
            <button
              type="button"
              onClick={handleContactClick}
              className="rounded-lg px-3 py-2.5 text-left text-ink/80 transition-colors hover:bg-ink/5 hover:text-teal"
            >
              Contact us
            </button>

            {isReady && isMember && (
              <>
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
                  <span className="min-w-0">
                    {fullName && <span className="block truncate text-sm font-medium text-ink">{fullName}</span>}
                    <span className="block truncate text-xs text-muted">{user?.email}</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleLogoutClick}
                    className="shrink-0 rounded-full border border-ink/15 px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-terracotta hover:text-terracotta"
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
