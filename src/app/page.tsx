import Image from "next/image";
import Link from "next/link";
import { categoryOrder, unsplashUrl } from "@/data/sessions";
import { createClient } from "@/lib/supabase/server";
import { mapAnnouncement, mapSession } from "@/lib/supabase/mappers";
import SessionCard from "@/components/SessionCard";
import UpdatesCarousel from "@/components/UpdatesCarousel";
import HeroLoginButton from "@/components/HeroLoginButton";
import HeroLatestPreview from "@/components/HeroLatestPreview";
import CurriculumLoginBanner from "@/components/CurriculumLoginBanner";
import ContinueWatchingCard from "@/components/ContinueWatchingCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: sessionRows }, { data: childParentIds }, { data: announcementRows }] = await Promise.all([
    // Only top-level sessions appear on the curriculum grid — nested
    // sub-topics are discovered by browsing into their parent's own page.
    supabase.from("sessions").select("*").is("parent_id", null).order("position"),
    // Just enough to count sub-topics per top-level session for the
    // curriculum-grid badge, without fetching every sub-topic's full row.
    supabase.from("sessions").select("parent_id").not("parent_id", "is", null),
    supabase.from("announcements").select("*").order("position"),
  ]);

  const subTopicCounts = new Map<string, number>();
  for (const row of childParentIds ?? []) {
    if (!row.parent_id) continue;
    subTopicCounts.set(row.parent_id, (subTopicCounts.get(row.parent_id) ?? 0) + 1);
  }

  const sessions = (sessionRows ?? []).map(mapSession);
  // Once an announcement's last relevant day has passed, drop it from the
  // public site — unless the admin explicitly pinned it to stay visible.
  // A multi-day announcement's last day is its end date; otherwise it's
  // just its date (and an end date mistakenly set before the start date
  // can't make it disappear early).
  const today = new Date().toISOString().slice(0, 10);
  const announcements = (announcementRows ?? [])
    .map(mapAnnouncement)
    .filter((item) => {
      const lastVisibleDay = item.endDate && item.endDate > item.date ? item.endDate : item.date;
      return item.alwaysVisible || lastVisibleDay >= today;
    });

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
  if (user) {
    const { data: progressRow } = await supabase
      .from("content_block_progress")
      .select("content_block_id, sessions(*), content_blocks(title)")
      .eq("user_id", user.id)
      .order("last_active_at", { ascending: false })
      .limit(1)
      .maybeSingle();
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
  }

  return (
    <>
      <section className="relative overflow-hidden border-b border-ink/10">
        <div className="absolute inset-0">
          <Image
            src={unsplashUrl("1551076805-e1869033e561", 1800, 70)}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink/95 via-ink/80 to-ink/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-teal/20 blur-3xl sm:h-96 sm:w-96"
        />

        <div className="container-page relative grid grid-cols-1 items-center gap-10 py-20 sm:py-28 lg:grid-cols-[1.3fr_1fr] lg:gap-14 lg:py-32">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#8FC4BE]">
              Clinical Curriculum &middot; {sessions.length} Sessions
            </p>
            <h1 className="mt-5 max-w-3xl font-serif text-4xl font-medium leading-[1.1] text-porcelain sm:text-5xl lg:text-6xl">
              Rigorous, structured training for aesthetic medicine practitioners.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-porcelain/80 sm:text-lg">
              HADA Aesthetic Training takes you from facial anatomy fundamentals
              through injectables, devices, and safety protocol &mdash; a
              sequential curriculum built for real clinical practice.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="#curriculum"
                className="rounded-full bg-teal px-6 py-3 text-sm font-medium text-porcelain transition-colors hover:bg-teal-dark"
              >
                View the curriculum
              </Link>
              <HeroLoginButton />
            </div>
          </div>

          <HeroLatestPreview items={announcements} />
        </div>
      </section>

      <UpdatesCarousel items={announcements} />

      <section id="curriculum" className="container-page py-16 sm:py-24">
        <div className="mb-12 flex flex-col gap-4 sm:mb-16 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <h2 className="font-serif text-3xl font-medium text-ink sm:text-4xl">
              The curriculum
            </h2>
            <p className="mt-3 text-base leading-relaxed text-muted">
              Eight sessions, organized by clinical category and delivered in
              sequence &mdash; from foundational anatomy to advanced injectable
              and device technique.
            </p>
          </div>
          <CurriculumLoginBanner />
        </div>

        {continueWatching && (
          <ContinueWatchingCard
            sessionSlug={continueWatching.sessionSlug}
            sessionTitle={continueWatching.sessionTitle}
            sessionImageUrl={continueWatching.sessionImageUrl}
            blockId={continueWatching.blockId}
            blockTitle={continueWatching.blockTitle}
          />
        )}

        <div className="flex flex-col gap-16">
          {categoryOrder.map((category) => {
            const categorySessions = sessions
              .filter((session) => session.category === category)
              .sort((a, b) => a.position - b.position);
            if (categorySessions.length === 0) return null;

            return (
              <div key={category}>
                <div className="mb-6 flex items-center gap-4">
                  <h3 className="font-serif text-xl text-ink sm:text-2xl">
                    {category}
                  </h3>
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
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
