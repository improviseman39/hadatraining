import { categoryOrder } from "@/data/sessions";
import { createClient } from "@/lib/supabase/server";
import { mapSession } from "@/lib/supabase/mappers";
import SessionListRow from "@/components/SessionListRow";
import CurriculumLoginBanner from "@/components/CurriculumLoginBanner";
import ContinueWatchingCard from "@/components/ContinueWatchingCard";

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

  // One page for everyone: a logged-out visitor just browses (below); a
  // member additionally gets their dashboard (continue-watching, overall
  // %, per-card completion) inline on the same page, rather than a
  // separate /my-learning destination.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let continueWatching: {
    sessionSlug: string;
    sessionTitle: string;
    sessionImageUrl: string;
    blockId: string;
    blockTitle: string | null;
  } | null = null;
  const completionBySessionId = new Map<string, number>();
  let overallCompletionPercent: number | undefined;
  if (user) {
    const [{ data: progressRow }, { data: sessionProgressRows }] = await Promise.all([
      supabase
        .from("content_block_progress")
        .select("content_block_id, sessions(*), content_blocks(title)")
        .eq("user_id", user.id)
        .order("last_active_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from("my_session_progress").select("session_id, percent_complete"),
    ]);
    // Postgrest infers embedded to-one relations as arrays without a
    // generated Database type (this project doesn't have one) - normalize
    // either shape, same pattern as BookingCard's sessionInfo().
    const rawSession = progressRow?.sessions;
    const progressSession = (Array.isArray(rawSession) ? rawSession[0] : rawSession) as
      | Parameters<typeof mapSession>[0]
      | undefined;
    const rawBlock = progressRow?.content_blocks;
    const progressBlock = (Array.isArray(rawBlock) ? rawBlock[0] : rawBlock) as
      | { title: string | null }
      | undefined;
    if (progressRow && progressSession) {
      const mappedProgressSession = mapSession(progressSession);
      continueWatching = {
        sessionSlug: mappedProgressSession.slug,
        sessionTitle: mappedProgressSession.title,
        sessionImageUrl: mappedProgressSession.imageUrl,
        blockId: progressRow.content_block_id,
        blockTitle: progressBlock?.title ?? null,
      };
    }
    for (const row of sessionProgressRows ?? []) {
      completionBySessionId.set(row.session_id, row.percent_complete);
    }
    if (sessionProgressRows && sessionProgressRows.length > 0) {
      overallCompletionPercent = Math.round(
        sessionProgressRows.reduce((sum, row) => sum + row.percent_complete, 0) /
          sessionProgressRows.length
      );
    }
  }

  return (
    <div className="container-page py-8 sm:py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal">
            Clinical curriculum
          </p>
          <h1 className="mt-1.5 font-serif text-2xl font-medium text-ink sm:text-3xl">
            The curriculum
          </h1>
        </div>
        <CurriculumLoginBanner />
      </div>

      {overallCompletionPercent !== undefined && (
        <div className="mt-5 rounded-2xl border border-teal/20 bg-teal/5 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-ink">Your overall progress</p>
              <p className="mt-0.5 text-xs text-muted">
                Across all {sessions.length} session{sessions.length === 1 ? "" : "s"}
              </p>
            </div>
            <span
              className={`text-xl font-serif font-medium ${
                overallCompletionPercent === 100 ? "text-teal" : "text-ink"
              }`}
            >
              {overallCompletionPercent}%
            </span>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-ink/10">
            <div
              className="h-full rounded-full bg-teal transition-all"
              style={{ width: `${overallCompletionPercent}%` }}
            />
          </div>
        </div>
      )}

      {continueWatching && (
        <div className="mt-4">
          <ContinueWatchingCard
            sessionSlug={continueWatching.sessionSlug}
            sessionTitle={continueWatching.sessionTitle}
            sessionImageUrl={continueWatching.sessionImageUrl}
            blockId={continueWatching.blockId}
            blockTitle={continueWatching.blockTitle}
          />
        </div>
      )}

      <div className="mt-6 flex flex-col gap-6 sm:mt-7 sm:gap-7">
        {categoryOrder.map((category) => {
          const categorySessions = sessions
            .filter((session) => session.category === category)
            .sort((a, b) => a.position - b.position);
          if (categorySessions.length === 0) return null;

          return (
            <div key={category}>
              <div className="mb-2.5 flex items-center gap-3">
                <h2 className="font-serif text-lg text-ink">{category}</h2>
                <span className="h-px flex-1 bg-ink/10" />
                <span className="text-xs text-muted">
                  {categorySessions.length} session
                  {categorySessions.length > 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {categorySessions.map((session) => (
                  <SessionListRow
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
