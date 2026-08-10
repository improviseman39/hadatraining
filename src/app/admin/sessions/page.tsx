import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";
import { deleteSession, moveSession } from "@/app/admin/sessions/actions";
import ActionButton from "@/components/admin/ActionButton";

export const dynamic = "force-dynamic";

type SessionRow = {
  id: string;
  slug: string;
  title: string;
  category: string;
  is_free: boolean;
  position: number;
  parent_id: string | null;
};

type FlatRow = {
  session: SessionRow;
  depth: number;
  siblingIndex: number;
  siblingCount: number;
};

/** Depth-first flatten of the parent_id tree, so each row knows its depth
 * (for indentation) and its position among its own siblings (for correct
 * "already at the edge" up/down disabling — not the overall list index). */
function flattenTree(sessions: SessionRow[]): FlatRow[] {
  const childrenByParent = new Map<string | null, SessionRow[]>();
  for (const session of sessions) {
    const key = session.parent_id;
    if (!childrenByParent.has(key)) childrenByParent.set(key, []);
    childrenByParent.get(key)!.push(session);
  }
  for (const list of childrenByParent.values()) list.sort((a, b) => a.position - b.position);

  const result: FlatRow[] = [];
  function walk(parentId: string | null, depth: number) {
    const siblings = childrenByParent.get(parentId) ?? [];
    siblings.forEach((session, siblingIndex) => {
      result.push({ session, depth, siblingIndex, siblingCount: siblings.length });
      walk(session.id, depth + 1);
    });
  }
  walk(null, 0);
  return result;
}

export default async function AdminSessionsPage() {
  await requireRole(["admin", "super_admin"]);
  const supabase = await createClient();
  const [{ data: sessions }, { data: bookingRows }] = await Promise.all([
    supabase
      .from("sessions")
      .select("id, slug, title, category, is_free, position, parent_id")
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

  const rows = flattenTree(sessions ?? []);

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
            {rows.map(({ session, depth, siblingIndex, siblingCount }) => (
              <tr key={session.id} className="border-b border-ink/5 last:border-0">
                <td className="px-4 py-3 text-muted">{session.position}</td>
                <td className="px-4 py-3 font-medium text-ink">
                  <div style={{ paddingLeft: `${depth * 1.5}rem` }} className="flex items-center gap-1.5">
                    {depth > 0 && <span className="text-muted">&#8627;</span>}
                    <Link href={`/admin/sessions/${session.id}`} className="hover:text-teal">
                      {session.title}
                    </Link>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted">{session.category}</td>
                <td className="px-4 py-3">
                  {depth > 0 ? (
                    <span className="rounded-full border border-ink/10 px-2 py-0.5 text-xs font-medium text-muted">
                      Inherited
                    </span>
                  ) : session.is_free ? (
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
                    <ActionButton
                      action={moveSession.bind(null, session.id, "up")}
                      disabled={siblingIndex === 0}
                      ariaLabel="Move up"
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-ink/15 text-ink transition-colors hover:border-teal hover:text-teal disabled:opacity-30"
                    >
                      &uarr;
                    </ActionButton>
                    <ActionButton
                      action={moveSession.bind(null, session.id, "down")}
                      disabled={siblingIndex === siblingCount - 1}
                      ariaLabel="Move down"
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-ink/15 text-ink transition-colors hover:border-teal hover:text-teal disabled:opacity-30"
                    >
                      &darr;
                    </ActionButton>
                    <Link
                      href={`/admin/sessions/new?parent=${session.id}`}
                      className="rounded-full border border-ink/15 px-3 py-1 text-xs font-medium text-ink transition-colors hover:border-teal hover:text-teal"
                    >
                      + Sub-topic
                    </Link>
                    <Link
                      href={`/admin/sessions/${session.id}`}
                      className="rounded-full border border-ink/15 px-3 py-1 text-xs font-medium text-ink transition-colors hover:border-teal hover:text-teal"
                    >
                      Edit
                    </Link>
                    <ActionButton
                      action={deleteSession.bind(null, session.id)}
                      confirmMessage={
                        bookingCountBySession.has(session.id)
                          ? `Delete "${session.title}"? This also deletes its content blocks${depth === 0 ? ", any sub-topics inside it," : ""} and ${bookingCountBySession.get(session.id)} existing booking(s) will lose their topic.`
                          : `Delete "${session.title}"? This also deletes its content blocks${depth === 0 ? " and any sub-topics inside it" : ""}.`
                      }
                      className="rounded-full border border-ink/15 px-3 py-1 text-xs font-medium text-terracotta transition-colors hover:border-terracotta"
                    >
                      Delete
                    </ActionButton>
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
