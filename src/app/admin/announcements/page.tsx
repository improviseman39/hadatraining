import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";
import { deleteAnnouncement, moveAnnouncement } from "@/app/admin/announcements/actions";
import ActionButton from "@/components/admin/ActionButton";

export const dynamic = "force-dynamic";

export default async function AdminAnnouncementsPage() {
  await requireRole(["admin", "super_admin"]);
  const supabase = await createClient();
  const { data: announcements } = await supabase
    .from("announcements")
    .select("id, title, category, date, end_date, always_visible, position")
    .order("position");
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-serif text-xl text-ink">Announcements</h2>
        <Link
          href="/admin/announcements/new"
          className="rounded-full bg-teal px-4 py-2 text-sm font-medium text-porcelain transition-colors hover:bg-teal-dark"
        >
          + Add announcement
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-ink/10 bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink/10 bg-porcelain/60 text-xs font-medium uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(announcements ?? []).map((item, i) => {
              const lastVisibleDay =
                item.end_date && item.end_date > item.date ? item.end_date : item.date;
              const isPastDue = lastVisibleDay < today;
              return (
              <tr key={item.id} className="border-b border-ink/5 last:border-0">
                <td className="px-4 py-3 text-muted">{item.position}</td>
                <td className="px-4 py-3 font-medium text-ink">
                  <Link href={`/admin/announcements/${item.id}`} className="hover:text-teal">
                    {item.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted">{item.category}</td>
                <td className="px-4 py-3 text-muted">
                  {item.date}
                  {item.end_date && item.end_date > item.date ? ` – ${item.end_date}` : ""}
                </td>
                <td className="px-4 py-3">
                  {isPastDue && item.always_visible ? (
                    <span className="rounded-full bg-teal/10 px-2.5 py-1 text-xs font-medium text-teal-dark">
                      Expired · kept visible
                    </span>
                  ) : isPastDue ? (
                    <span className="rounded-full bg-terracotta/10 px-2.5 py-1 text-xs font-medium text-terracotta">
                      Expired · hidden from site
                    </span>
                  ) : (
                    <span className="rounded-full bg-teal/10 px-2.5 py-1 text-xs font-medium text-teal-dark">
                      Live
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <ActionButton
                      action={moveAnnouncement.bind(null, item.id, "up")}
                      disabled={i === 0}
                      ariaLabel="Move up"
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-ink/15 text-ink transition-colors hover:border-teal hover:text-teal disabled:opacity-30"
                    >
                      &uarr;
                    </ActionButton>
                    <ActionButton
                      action={moveAnnouncement.bind(null, item.id, "down")}
                      disabled={i === (announcements?.length ?? 0) - 1}
                      ariaLabel="Move down"
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-ink/15 text-ink transition-colors hover:border-teal hover:text-teal disabled:opacity-30"
                    >
                      &darr;
                    </ActionButton>
                    <Link
                      href={`/admin/announcements/${item.id}`}
                      className="rounded-full border border-ink/15 px-3 py-1 text-xs font-medium text-ink transition-colors hover:border-teal hover:text-teal"
                    >
                      Edit
                    </Link>
                    <ActionButton
                      action={deleteAnnouncement.bind(null, item.id)}
                      confirmMessage={`Delete "${item.title}"?`}
                      className="rounded-full border border-ink/15 px-3 py-1 text-xs font-medium text-terracotta transition-colors hover:border-terracotta"
                    >
                      Delete
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
