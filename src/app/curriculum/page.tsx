import { categoryOrder } from "@/data/sessions";
import { createClient } from "@/lib/supabase/server";
import { mapSession } from "@/lib/supabase/mappers";
import SessionCard from "@/components/SessionCard";
import CurriculumLoginBanner from "@/components/CurriculumLoginBanner";

export const dynamic = "force-dynamic";

export default async function CurriculumPage() {
  const supabase = await createClient();

  const [{ data: sessionRows }, { data: childParentIds }] = await Promise.all([
    // Only top-level sessions appear on the curriculum grid — nested
    // sub-topics are discovered by browsing into their parent's own page.
    supabase.from("sessions").select("*").is("parent_id", null).order("position"),
    // Just enough to count sub-topics per top-level session for the
    // curriculum-grid badge, without fetching every sub-topic's full row.
    supabase.from("sessions").select("parent_id").not("parent_id", "is", null),
  ]);

  const subTopicCounts = new Map<string, number>();
  for (const row of childParentIds ?? []) {
    if (!row.parent_id) continue;
    subTopicCounts.set(row.parent_id, (subTopicCounts.get(row.parent_id) ?? 0) + 1);
  }

  const sessions = (sessionRows ?? []).map(mapSession);

  // Per-session completion badges stay here so browsing still shows "what
  // have I done" at a glance — the fuller dashboard (continue-watching,
  // overall %) lives at /my-learning instead of duplicating it here.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const completionBySessionId = new Map<string, number>();
  if (user) {
    const { data: sessionProgressRows } = await supabase
      .from("my_session_progress")
      .select("session_id, percent_complete");
    for (const row of sessionProgressRows ?? []) {
      completionBySessionId.set(row.session_id, row.percent_complete);
    }
  }

  return (
    <div className="container-page py-12 sm:py-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal">
            Clinical curriculum
          </p>
          <h1 className="mt-2 font-serif text-3xl font-medium text-ink sm:text-4xl">
            The curriculum
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted">
            Eight sessions, organized by clinical category and delivered in
            sequence &mdash; from foundational anatomy to advanced injectable
            and device technique.
          </p>
        </div>
        <CurriculumLoginBanner />
      </div>

      <div className="mt-12 flex flex-col gap-16 sm:mt-16">
        {categoryOrder.map((category) => {
          const categorySessions = sessions
            .filter((session) => session.category === category)
            .sort((a, b) => a.position - b.position);
          if (categorySessions.length === 0) return null;

          return (
            <div key={category}>
              <div className="mb-6 flex items-center gap-4">
                <h2 className="font-serif text-xl text-ink sm:text-2xl">
                  {category}
                </h2>
                <span className="h-px flex-1 bg-ink/10" />
                <span className="text-sm text-muted">
                  {categorySessions.length} session
                  {categorySessions.length > 1 ? "s" : ""}
                </span>
              </div>
              <div
                className={`grid gap-5 ${
                  categorySessions.length === 1
                    ? "max-w-sm grid-cols-1"
                    : categorySessions.length === 2
                      ? "max-w-3xl grid-cols-1 sm:grid-cols-2"
                      : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                }`}
              >
                {categorySessions.map((session) => (
                  <SessionCard
                    key={session.slug}
                    session={session}
                    subTopicCount={subTopicCounts.get(session.id) ?? 0}
                    completionPercent={completionBySessionId.get(session.id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
