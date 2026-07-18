import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { deleteSession, moveSession } from "@/app/admin/sessions/actions";
import ConfirmSubmitButton from "@/components/admin/ConfirmSubmitButton";

export const dynamic = "force-dynamic";

export default async function AdminSessionsPage() {
  const supabase = createClient();
  const [{ data: sessions }, { data: bookingRows }] = await Promise.all([
    supabase
      .from("sessions")
      .select("id, slug, title, category, is_free, position")
      .order("position"),
    supabase.from("bookings").select("session_id"),
  ]);

  const bookingCountBySession = new Map<string, number>();
  for (const row of bookingRows ?? []) {
    if (!row.session_id) continue;
    bookingCountBySession.set(
      row.session_id,
      (bookingCountBySession.get(row.session_id) ?? 0) + 1
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-serif text-xl text-ink">Sessions</h2>
        <Link
          href="/admin/sessions/new"
          className="rounded-full bg-teal px-4 py-2 text-sm font-medium text-porcelain transition-colors hover:bg-teal-dark"
        >
          + Add session
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-ink/10 bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink/10 bg-porcelain/60 text-xs font-medium uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Access</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(sessions ?? []).map((session, i) => (
              <tr key={session.id} className="border-b border-ink/5 last:border-0">
                <td className="px-4 py-3 text-muted">{session.position}</td>
                <td className="px-4 py-3 font-medium text-ink">
                  <Link href={`/admin/sessions/${session.id}`} className="hover:text-teal">
                    {session.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted">{session.category}</td>
                <td className="px-4 py-3">
                  {session.is_free ? (
                    <span className="rounded-full bg-teal/10 px-2 py-0.5 text-xs font-medium text-teal-dark">
                      Free
                    </span>
                  ) : (
                    <span className="rounded-full bg-terracotta/10 px-2 py-0.5 text-xs font-medium text-terracotta">
                      Members
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <form action={moveSession.bind(null, session.id, "up")}>
                      <button
                        type="submit"
                        disabled={i === 0}
                        aria-label="Move up"
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-ink/15 text-ink transition-colors hover:border-teal hover:text-teal disabled:opacity-30"
                      >
                        &uarr;
                      </button>
                    </form>
                    <form action={moveSession.bind(null, session.id, "down")}>
                      <button
                        type="submit"
                        disabled={i === (sessions?.length ?? 0) - 1}
                        aria-label="Move down"
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-ink/15 text-ink transition-colors hover:border-teal hover:text-teal disabled:opacity-30"
                      >
                        &darr;
                      </button>
                    </form>
                    <Link
                      href={`/admin/sessions/${session.id}`}
                      className="rounded-full border border-ink/15 px-3 py-1 text-xs font-medium text-ink transition-colors hover:border-teal hover:text-teal"
                    >
                      Edit
                    </Link>
                    <form action={deleteSession.bind(null, session.id)}>
                      <ConfirmSubmitButton
                        confirmMessage={
                          bookingCountBySession.has(session.id)
                            ? `Delete "${session.title}"? This also deletes its content blocks, and ${bookingCountBySession.get(session.id)} existing booking(s) will lose their topic.`
                            : `Delete "${session.title}"? This also deletes its content blocks.`
                        }
                        className="rounded-full border border-ink/15 px-3 py-1 text-xs font-medium text-terracotta transition-colors hover:border-terracotta"
                      >
                        Delete
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
