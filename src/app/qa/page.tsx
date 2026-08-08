import { createClient } from "@/lib/supabase/server";
import { mapQaEntry } from "@/lib/supabase/mappers";
import QaAccordion from "@/components/QaAccordion";

export const dynamic = "force-dynamic";

export default async function QaPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("qa_entries")
    .select("id, question, answer, position")
    .order("position");

  const entries = (data ?? []).map(mapQaEntry);

  return (
    <div className="container-page py-12 sm:py-16">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal">
        Questions &amp; answers
      </p>
      <h1 className="mt-2 font-serif text-3xl font-medium text-ink sm:text-4xl">
        Q&amp;A
      </h1>
      <p className="mt-3 max-w-xl text-sm text-muted">
        Answers to the questions we hear most often. Can&rsquo;t find what
        you&rsquo;re looking for? Use the Contact us button to ask us directly.
      </p>

      <div className="mt-10 max-w-2xl">
        {entries.length === 0 ? (
          <p className="text-sm text-muted">No Q&amp;A entries yet.</p>
        ) : (
          <QaAccordion entries={entries} />
        )}
      </div>
    </div>
  );
}
