import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role } = await requireRole(["admin", "super_admin"]);

  const supabase = await createClient();
  const { count: newRequestCount } = await supabase
    .from("requests")
    .select("id", { count: "exact", head: true })
    .eq("status", "new");

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="mb-8 flex flex-col gap-4 border-b border-ink/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-teal">
            Admin
          </p>
          <h1 className="mt-1 font-serif text-2xl text-ink sm:text-3xl">
            Content Management
          </h1>
        </div>
        <nav className="flex flex-wrap items-center gap-2 text-sm">
          <Link
            href="/admin/sessions"
            className="rounded-full border border-ink/15 px-4 py-2 font-medium text-ink transition-colors hover:border-teal hover:text-teal"
          >
            Sessions
          </Link>
          <Link
            href="/admin/announcements"
            className="rounded-full border border-ink/15 px-4 py-2 font-medium text-ink transition-colors hover:border-teal hover:text-teal"
          >
            Announcements
          </Link>
          <Link
            href="/admin/bookings"
            className="rounded-full border border-ink/15 px-4 py-2 font-medium text-ink transition-colors hover:border-teal hover:text-teal"
          >
            Bookings
          </Link>
          <Link
            href="/admin/requests"
            className="flex items-center gap-1.5 rounded-full border border-ink/15 px-4 py-2 font-medium text-ink transition-colors hover:border-teal hover:text-teal"
          >
            Requests
            {!!newRequestCount && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-terracotta px-1.5 text-xs font-semibold text-porcelain">
                {newRequestCount}
              </span>
            )}
          </Link>
          {role === "super_admin" && (
            <Link
              href="/admin/users"
              className="rounded-full border border-ink/15 px-4 py-2 font-medium text-ink transition-colors hover:border-teal hover:text-teal"
            >
              Users
            </Link>
          )}
        </nav>
      </div>
      {children}
    </div>
  );
}
