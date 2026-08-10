import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";
import { deleteQaEntry, moveQaEntry } from "@/app/admin/qa/actions";
import ActionButton from "@/components/admin/ActionButton";

export const dynamic = "force-dynamic";

export default async function AdminQaPage() {
  await requireRole(["admin", "super_admin"]);
  const supabase = await createClient();
  const { data: entries } = await supabase
    .from("qa_entries")
    .select("id, question, answer, position")
    .order("position");

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-serif text-xl text-ink">Q&amp;A</h2>
        <Link
          href="/admin/qa/new"
          className="rounded-full bg-teal px-4 py-2 text-sm font-medium text-porcelain transition-colors hover:bg-teal-dark"
        >
          + Add Q&amp;A
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-ink/10 bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink/10 bg-porcelain/60 text-xs font-medium uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Question</th>
              <th className="px-4 py-3">Answer</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(entries ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted">
                  No Q&amp;A entries yet.
                </td>
              </tr>
            )}
            {(entries ?? []).map((item, i) => (
              <tr key={item.id} className="border-b border-ink/5 last:border-0">
                <td className="px-4 py-3 text-muted">{item.position}</td>
                <td className="max-w-xs px-4 py-3 font-medium text-ink">
                  <Link href={`/admin/qa/${item.id}`} className="hover:text-teal">
                    {item.question}
                  </Link>
                </td>
                <td className="max-w-sm truncate px-4 py-3 text-muted">{item.answer}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <ActionButton
                      action={moveQaEntry.bind(null, item.id, "up")}
                      disabled={i === 0}
                      ariaLabel="Move up"
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-ink/15 text-ink transition-colors hover:border-teal hover:text-teal disabled:opacity-30"
                    >
                      &uarr;
                    </ActionButton>
                    <ActionButton
                      action={moveQaEntry.bind(null, item.id, "down")}
                      disabled={i === (entries?.length ?? 0) - 1}
                      ariaLabel="Move down"
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-ink/15 text-ink transition-colors hover:border-teal hover:text-teal disabled:opacity-30"
                    >
                      &darr;
                    </ActionButton>
                    <Link
                      href={`/admin/qa/${item.id}`}
                      className="rounded-full border border-ink/15 px-3 py-1 text-xs font-medium text-ink transition-colors hover:border-teal hover:text-teal"
                    >
                      Edit
                    </Link>
                    <ActionButton
                      action={deleteQaEntry.bind(null, item.id)}
                      confirmMessage={`Delete "${item.question}"?`}
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
