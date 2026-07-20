import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { deleteBooking } from "@/app/admin/bookings/actions";
import LocalDateTime from "@/components/LocalDateTime";
import ActionButton from "@/components/admin/ActionButton";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage() {
  const supabase = createClient();

  const [{ data: bookings }, { data: profiles }] = await Promise.all([
    supabase
      .from("bookings")
      .select("id, user_id, start_at, end_at, notes, sessions(title)")
      .order("start_at", { ascending: false }),
    supabase.rpc("list_profiles_for_booking"),
  ]);

  const emailById = new Map<string, string>(
    (profiles ?? []).map((p: { id: string; email: string }) => [p.id, p.email])
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-serif text-xl text-ink">Bookings</h2>
        <Link
          href="/admin/bookings/new"
          className="rounded-full bg-teal px-4 py-2 text-sm font-medium text-porcelain transition-colors hover:bg-teal-dark"
        >
          + Add booking
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-ink/10 bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink/10 bg-porcelain/60 text-xs font-medium uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Topic</th>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(bookings ?? []).map((booking) => {
              const sessionRel = booking.sessions as
                | { title: string }[]
                | { title: string }
                | null;
              const sessionTitle: string = Array.isArray(sessionRel)
                ? sessionRel[0]?.title ?? "Session no longer available"
                : sessionRel?.title ?? "Session no longer available";

              return (
                <tr key={booking.id} className="border-b border-ink/5 last:border-0">
                  <td className="px-4 py-3 font-medium text-ink">
                    {emailById.get(booking.user_id) ?? "Unknown user"}
                  </td>
                  <td className="px-4 py-3 text-muted">{sessionTitle}</td>
                  <td className="px-4 py-3 text-muted">
                    <LocalDateTime value={booking.start_at} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/admin/bookings/${booking.id}`}
                        className="rounded-full border border-ink/15 px-3 py-1 text-xs font-medium text-ink transition-colors hover:border-teal hover:text-teal"
                      >
                        Edit
                      </Link>
                      <ActionButton
                        action={deleteBooking.bind(null, booking.id)}
                        confirmMessage="Cancel this booking?"
                        className="rounded-full border border-ink/15 px-3 py-1 text-xs font-medium text-terracotta transition-colors hover:border-terracotta"
                      >
                        Cancel
                      </ActionButton>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
