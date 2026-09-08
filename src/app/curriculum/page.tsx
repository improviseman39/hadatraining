import { categoryOrder } from "@/data/sessions";
import { createClient } from "@/lib/supabase/server";
import { mapSession } from "@/lib/supabase/mappers";
import SessionGridCard from "@/components/SessionGridCard";
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
    <div className="container-page py-3 sm:py-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-teal sm:text-sm">
            Clinical curriculum
          </p>
          <h1 className="mt-1 font-serif text-xl font-medium text-ink sm:text-2xl">
            The curriculum
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end">
          {overallCompletionPercent !== undefined && (
            <div className="flex shrink-0 items-center gap-2.5 rounded-2xl border border-teal/20 bg-teal/5 py-1.5 pl-3 pr-3.5">
              <span
                aria-hidden="true"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal/10 text-teal-dark"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 4a8 8 0 108 8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path d="M12 4v8l5 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <div>
                <p className="text-[9px] font-medium uppercase leading-none tracking-wide text-teal-dark">
                  Your progress
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-ink/10">
                    <div
                      className="h-full rounded-full bg-teal transition-all"
                      style={{ width: `${overallCompletionPercent}%` }}
                    />
                  </div>
                  <span className="whitespace-nowrap text-xs font-medium leading-none text-ink">
                    {overallCompletionPercent}% complete
                  </span>
                </div>
              </div>
            </div>
          )}

          {continueWatching && (
            <ContinueWatchingCard
              compact
              sessionSlug={continueWatching.sessionSlug}
              sessionTitle={continueWatching.sessionTitle}
              sessionImageUrl={continueWatching.sessionImageUrl}
              blockId={continueWatching.blockId}
              blockTitle={continueWatching.blockTitle}
            />
          )}

          <CurriculumLoginBanner />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:mt-4 md:grid-cols-4 md:gap-4">
        {categoryOrder.map((category) => {
          const categorySessions = sessions
            .filter((session) => session.category === category)
            .sort((a, b) => a.position - b.position);
          if (categorySessions.length === 0) return null;

          return (
            <div key={category}>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <h2 className="font-serif text-sm text-ink">{category}</h2>
                <span className="text-[11px] text-muted">{categorySessions.length}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {categorySessions.map((session) => (
                  <SessionGridCard
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
