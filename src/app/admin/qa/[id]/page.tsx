import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateQaEntry } from "@/app/admin/qa/actions";
import QaEntryForm from "@/components/admin/QaEntryForm";

export const dynamic = "force-dynamic";

export default async function EditQaEntryPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const supabase = await createClient();
  const { data: entry, error } = await supabase
    .from("qa_entries")
    .select("*")
    .eq("id", params.id)
    .single();
  if (error || !entry) notFound();

  return (
    <div>
      <Link
        href="/admin/qa"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-teal"
      >
        &larr; Back to Q&amp;A
      </Link>
      <h2 className="mb-6 font-serif text-xl text-ink">Edit Q&amp;A entry</h2>
      <div className="max-w-xl rounded-2xl border border-ink/10 bg-card p-6 shadow-sm sm:p-7">
        <QaEntryForm
          action={updateQaEntry.bind(null, entry.id)}
          defaultValues={entry}
          submitLabel="Save changes"
        />
      </div>
    </div>
  );
}
