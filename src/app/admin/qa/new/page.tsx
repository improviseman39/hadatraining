import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { createQaEntry } from "@/app/admin/qa/actions";
import QaEntryForm from "@/components/admin/QaEntryForm";

export default async function NewQaEntryPage(props: {
  searchParams: Promise<{ question?: string; answer?: string }>;
}) {
  await requireRole(["admin", "super_admin"]);
  const searchParams = await props.searchParams;

  return (
    <div>
      <Link
        href="/admin/qa"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-teal"
      >
        &larr; Back to Q&amp;A
      </Link>
      <h2 className="mb-6 font-serif text-xl text-ink">New Q&amp;A entry</h2>
      <div className="max-w-xl rounded-2xl border border-ink/10 bg-card p-6 shadow-sm sm:p-7">
        <QaEntryForm
          action={createQaEntry}
          defaultValues={{
            question: searchParams.question,
            answer: searchParams.answer,
          }}
          submitLabel="Create Q&A entry"
          showPrivacyReminder={Boolean(searchParams.question || searchParams.answer)}
        />
      </div>
    </div>
  );
}
