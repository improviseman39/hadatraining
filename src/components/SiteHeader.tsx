"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useRequestWidget } from "@/context/RequestWidgetContext";
import { createClient } from "@/lib/supabase/client";
import SiteSearch from "@/components/SiteSearch";

export default function SiteHeader() {
  const { isMember, isReady, role, logout } = useAuth();
  const { openWidget } = useRequestWidget();
  const isStaff = role === "admin" || role === "super_admin";
  const pathname = usePathname();
  const [newRequestCount, setNewRequestCount] = useState(0);

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

  return (
    <header className="border-b border-ink/10 bg-porcelain/95 backdrop-blur supports-[backdrop-filter]:bg-porcelain/80 sticky top-0 z-40">
      <div className="container-page flex h-16 items-center justify-between sm:h-20">
        <Link
          href="/"
          className="flex items-baseline gap-2 font-serif text-lg font-semibold tracking-tight text-ink sm:text-xl"
        >
          <span>HADA</span>
          <span className="hidden text-sm font-normal tracking-wide text-muted sm:inline">
            Aesthetic Training
          </span>
        </Link>
        <nav className="flex items-center gap-3 text-sm sm:gap-5">
          <Link
            href="/#curriculum"
            className="hidden text-ink/80 transition-colors hover:text-teal sm:inline"
          >
            Curriculum
          </Link>
          <Link
            href="/#updates"
            className="hidden text-ink/80 transition-colors hover:text-teal sm:inline"
          >
            Updates
          </Link>
          <SiteSearch />

          {isReady && isMember ? (
            <div className="flex items-center gap-3">
              <Link
                href="/timetable"
                className="hidden rounded-full border border-ink/15 px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-teal hover:text-teal sm:inline"
              >
                Timetable
              </Link>
              <button
                type="button"
                onClick={openWidget}
                className="hidden rounded-full border border-ink/15 px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-teal hover:text-teal sm:inline"
              >
                Contact us
              </button>
              {isStaff && (
                <Link
                  href="/admin"
                  className="hidden items-center gap-1.5 rounded-full border border-teal/30 px-3 py-1.5 text-xs font-medium text-teal-dark transition-colors hover:border-teal sm:inline-flex"
                >
                  Admin
                  {newRequestCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-terracotta px-1.5 text-xs font-semibold text-porcelain">
                      {newRequestCount}
                    </span>
                  )}
                </Link>
              )}
              <span className="hidden items-center gap-1.5 rounded-full bg-teal/10 px-3 py-1.5 text-xs font-medium text-teal-dark sm:flex">
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 rounded-full bg-teal"
                />
                Member
              </span>
              <button
                type="button"
                onClick={logout}
                className="rounded-full border border-ink/15 px-4 py-2 font-medium text-ink transition-colors hover:border-terracotta hover:text-terracotta sm:px-5"
              >
                Log out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-teal px-4 py-2 font-medium text-porcelain transition-colors hover:bg-teal-dark sm:px-5"
            >
              Log in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
