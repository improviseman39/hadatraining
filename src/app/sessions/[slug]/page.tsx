import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapSession, mapSessionWithBlocks } from "@/lib/supabase/mappers";
import SessionContent, { type BlockProgress } from "@/components/SessionContent";
import CategoryTreeSidebar from "@/components/CategoryTreeSidebar";
import NotesPanel from "@/components/NotesPanel";
import SessionLayout from "@/components/SessionLayout";
import type { SessionWithBlocks } from "@/types/content";

type Crumb = { slug: string; title: string };

/** Walks parent_id upward to build a breadcrumb — arbitrary depth, so this
 * loops rather than assuming a fixed number of levels. */
async function buildBreadcrumb(
  supabase: Awaited<ReturnType<typeof createClient>>,
  parentId: string | null
): Promise<Crumb[]> {
  const crumbs: Crumb[] = [];
  let currentParentId = parentId;
  while (currentParentId) {
    const { data: parent } = await supabase
      .from("sessions")
      .select("slug, title, parent_id")
      .eq("id", currentParentId)
      .single();
    if (!parent) break;
    crumbs.unshift({ slug: parent.slug, title: parent.title });
    currentParentId = parent.parent_id;
  }
  return crumbs;
}

const PDF_BUCKET = "session-pdfs";
const PDF_SIGNED_URL_TTL_SECONDS = 60 * 60;

/**
 * Blocks from mapSessionWithBlocks are already access-gated by
 * content_blocks' own RLS (a non-member never gets a locked session's
 * blocks in the first place) — so it's safe to mint a signed URL here via
 * the service-role client for whatever pdf blocks were actually returned.
 */
async function signPdfBlocks(blocks: SessionWithBlocks["blocks"]) {
  const admin = createAdminClient();
  return Promise.all(
    blocks.map(async (block) => {
      if (block.type !== "pdf" || !block.pdfStoragePath) return block;
      const { data } = await admin.storage
        .from(PDF_BUCKET)
        .createSignedUrl(block.pdfStoragePath, PDF_SIGNED_URL_TTL_SECONDS);
      return { ...block, pdfUrl: data?.signedUrl ?? block.pdfUrl };
    })
  );
}

export const dynamic = "force-dynamic";

export async function generateMetadata(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const supabase = await createClient();
  const { data: session } = await supabase
    .from("sessions")
    .select("title, summary")
    .eq("slug", params.slug)
    .single();
  if (!session) return {};
  return {
    title: `${session.title} — HADA Aesthetic Training`,
    description: session.summary,
  };
}

export default async function SessionPage(
  props: {
    params: Promise<{ slug: string }>;
  }
) {
  const params = await props.params;
  const supabase = await createClient();

  const { data: sessionRow, error } = await supabase
    .from("sessions")
    .select("*, content_blocks(*)")
    .eq("slug", params.slug)
    .order("position", { foreignTable: "content_blocks" })
    .single();

  if (error || !sessionRow) notFound();

  const mappedSession = mapSessionWithBlocks(sessionRow);
  const session = {
    ...mappedSession,
    blocks: await signPdfBlocks(mappedSession.blocks),
  };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const progressByBlockId: Record<string, BlockProgress> = {};
  let resumeBlockId: string | null = null;
  let sessionCompletionPercent: number | undefined;
  if (user) {
    const { data: progressRows } = await supabase
      .from("content_block_progress")
      .select("content_block_id, last_position_seconds, max_position_seconds, duration_seconds, viewed, last_active_at")
      .eq("session_id", session.id);
    for (const row of progressRows ?? []) {
      progressByBlockId[row.content_block_id] = {
        lastPositionSeconds: row.last_position_seconds,
        viewed: row.viewed,
      };
    }
    // Most-recently-active block in this session becomes the "continue
    // where you left off" jump target, if there's more than one to choose
    // between.
    resumeBlockId =
      (progressRows ?? []).slice().sort(
        (a, b) => new Date(b.last_active_at).getTime() - new Date(a.last_active_at).getTime()
      )[0]?.content_block_id ?? null;

    // Same formula as the my_block_progress/my_session_progress views
    // (0029_progress_views.sql), computed inline here since the raw rows
    // for this one session are already in hand - no need for a second
    // round-trip to the view for a single session's worth of blocks.
    const progressRowByBlockId = new Map((progressRows ?? []).map((r) => [r.content_block_id, r]));
    const blockPercents = session.blocks.map((block) => {
      const row = progressRowByBlockId.get(block.id);
      if (block.type === "video") {
        const duration = row?.duration_seconds ?? 0;
        if (!row || !duration) return 0;
        return Math.min(100, Math.floor((row.max_position_seconds / duration) * 100));
      }
      return row?.viewed ? 100 : 0;
    });
    sessionCompletionPercent = blockPercents.length
      ? Math.round(blockPercents.reduce((sum, p) => sum + p, 0) / blockPercents.length)
      : undefined;
  }

  const breadcrumb = await buildBreadcrumb(supabase, session.parentId);

  const { data: childRows } = await supabase
    .from("sessions")
    .select("*")
    .eq("parent_id", session.id)
    .order("position");
  const children = (childRows ?? []).map(mapSession);

  // Viewing a sub-topic itself has no children of its own — page through
  // its siblings instead (needed below for Previous/Next), fetched via the
  // shared parent.
  let siblings: typeof children = [];
  if (children.length === 0 && session.parentId) {
    const { data: siblingRows } = await supabase
      .from("sessions")
      .select("*")
      .eq("parent_id", session.parentId)
      .order("position");
    siblings = (siblingRows ?? []).map(mapSession);
  }

  const isSiblingList = children.length === 0 && siblings.length > 0;
  // The module whose branch should start expanded in the sidebar tree —
  // this session itself if it's a top-level session, or its parent if
  // it's a sub-topic.
  const currentModuleId = isSiblingList ? (session.parentId ?? session.id) : session.id;

  // Prev/next: a top-level session pages through other top-level sessions;
  // a sub-topic pages through its siblings instead (siblings already
  // includes the current session, fetched above) — a linear "next lecture"
  // chain within the module, matching the mockup's sub-topic pager.
  let prevSession: { slug: string; title: string } | null = null;
  let nextSession: { slug: string; title: string } | null = null;
  if (!session.parentId) {
    const { data: neighborRows } = await supabase
      .from("sessions")
      .select("slug, title, position")
      .is("parent_id", null)
      .order("position");
    const neighbors = neighborRows ?? [];
    const currentIndex = neighbors.findIndex((s) => s.slug === session.slug);
    prevSession = currentIndex > 0 ? neighbors[currentIndex - 1] : null;
    nextSession =
      currentIndex >= 0 && currentIndex < neighbors.length - 1
        ? neighbors[currentIndex + 1]
        : null;
  } else if (isSiblingList) {
    const ordered = [...siblings].sort((a, b) => a.position - b.position);
    const currentIndex = ordered.findIndex((s) => s.slug === session.slug);
    prevSession = currentIndex > 0 ? ordered[currentIndex - 1] : null;
    nextSession =
      currentIndex >= 0 && currentIndex < ordered.length - 1
        ? ordered[currentIndex + 1]
        : null;
  }

  // Full sidebar tree: every top-level session in this session's category,
  // each with its own material blocks and sub-topics — lets the sidebar
  // offer the whole category to browse (any session's material, any
  // session's lectures), not just whatever's attached to the current page.
  const { data: categoryTopLevelRows } = await supabase
    .from("sessions")
    .select("*")
    .eq("category", session.category)
    .is("parent_id", null)
    .order("position");
  const categoryTopLevel = (categoryTopLevelRows ?? []).map(mapSession);
  const categoryTopLevelIds = categoryTopLevel.map((s) => s.id);

  // categoryTopLevelIds is never empty in practice — this session's own
  // module (itself, or its parent) is always one of the rows just fetched.
  const [{ data: categoryBlockRows }, { data: categoryChildRows }] = await Promise.all([
    supabase.from("content_blocks").select("id, title, session_id").in("session_id", categoryTopLevelIds).order("position"),
    supabase.from("sessions").select("*").in("parent_id", categoryTopLevelIds).order("position"),
  ]);

  const materialsBySession = new Map<string, { id: string; title: string | null }[]>();
  for (const row of categoryBlockRows ?? []) {
    const list = materialsBySession.get(row.session_id) ?? [];
    list.push({ id: row.id, title: row.title });
    materialsBySession.set(row.session_id, list);
  }
  const subTopicsBySession = new Map<string, ReturnType<typeof mapSession>[]>();
  for (const row of categoryChildRows ?? []) {
    if (!row.parent_id) continue;
    const list = subTopicsBySession.get(row.parent_id) ?? [];
    list.push(mapSession(row));
    subTopicsBySession.set(row.parent_id, list);
  }

  const categoryModules = categoryTopLevel.map((mod) => ({
    id: mod.id,
    slug: mod.slug,
    title: mod.title,
    imageUrl: mod.imageUrl,
    materials: (materialsBySession.get(mod.id) ?? []).map((block, index) => ({
      id: block.id,
      label: block.title ?? `Session material ${index + 1}`,
    })),
    subTopics: (subTopicsBySession.get(mod.id) ?? []).sort((a, b) => a.position - b.position),
  }));

  // Completion % per sub-topic across the WHOLE category tree (any of
  // which could be showing in the sidebar once expanded) — one query
  // against the same view the curriculum page already uses
  // (my_session_progress, 0029_progress_views.sql).
  const completionBySlug: Record<string, number> = {};
  if (user) {
    const allSubTopicIds = categoryModules.flatMap((mod) => mod.subTopics.map((s) => s.id));
    if (allSubTopicIds.length > 0) {
      const { data: rows } = await supabase
        .from("my_session_progress")
        .select("session_id, percent_complete")
        .in("session_id", allSubTopicIds);
      const idToSlug = new Map(
        categoryModules.flatMap((mod) => mod.subTopics.map((s) => [s.id, s.slug] as const))
      );
      for (const row of rows ?? []) {
        const slug = idToSlug.get(row.session_id);
        if (slug) completionBySlug[slug] = row.percent_complete;
      }
    }
    // This page's own completion was already computed above from its own
    // blocks directly — reuse it rather than trusting the view to be
    // freshly in sync with a block just watched this same request.
    if (sessionCompletionPercent !== undefined) {
      completionBySlug[session.slug] = sessionCompletionPercent;
    }
  }

  // "Continue where you left off" — for a module overview (has children),
  // the real resume target usually lives inside a child lecture, not this
  // page's own blocks, so this looks at the single most-recently-active
  // block across this session AND its children. For a sub-topic or a
  // childless session, the existing single-session resumeBlockId above
  // already covers it.
  let resumeTarget: { title: string; duration: string | null; href: string } | null = null;
  if (user && children.length > 0) {
    const { data: recentRows } = await supabase
      .from("content_block_progress")
      .select("content_block_id, session_id, last_active_at, sessions(slug)")
      .in("session_id", [session.id, ...children.map((c) => c.id)])
      .order("last_active_at", { ascending: false })
      .limit(1);
    const recent = recentRows?.[0];
    const rawTarget = recent?.sessions;
    const targetRow = (Array.isArray(rawTarget) ? rawTarget[0] : rawTarget) as { slug: string } | undefined;
    if (recent && targetRow) {
      const targetFull = targetRow.slug === session.slug ? session : children.find((c) => c.slug === targetRow.slug);
      if (targetFull) {
        resumeTarget = {
          title: targetFull.title,
          duration: targetFull.duration,
          href:
            recent.session_id === session.id
              ? `#block-${recent.content_block_id}`
              : `/sessions/${targetFull.slug}#block-${recent.content_block_id}`,
        };
      }
    }
  } else if (user && resumeBlockId) {
    resumeTarget = { title: session.title, duration: session.duration, href: `#block-${resumeBlockId}` };
  }

  const breadcrumbTrail: { label: string; href: string | null }[] = [
    { label: "Curriculum", href: "/curriculum" },
    { label: session.category, href: `/curriculum?category=${encodeURIComponent(session.category)}` },
    ...breadcrumb.map((crumb) => ({ label: crumb.title, href: `/sessions/${crumb.slug}` })),
    { label: session.title, href: null },
  ];

  return (
    <article className="container-page py-8 sm:py-10">
      <Link
        href="/curriculum"
        className="inline-flex w-fit items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1.5 text-xs font-medium text-ink/80 transition-colors hover:border-teal hover:text-teal"
      >
        <span aria-hidden="true">&larr;</span> Back to curriculum
      </Link>

      <nav aria-label="Breadcrumb" className="mt-4 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs font-medium uppercase tracking-wide text-muted">
        {breadcrumbTrail.map((crumb, index) => (
          <span key={crumb.label} className="flex items-center gap-1.5">
            {index > 0 && <span aria-hidden="true" className="text-ink/20">&rsaquo;</span>}
            {crumb.href ? (
              <Link href={crumb.href} className="transition-colors hover:text-teal">
                {crumb.label}
              </Link>
            ) : (
              <span className="text-ink/60">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>

      <h1 className="mt-2 font-serif text-2xl font-medium text-ink sm:text-3xl">
        {session.title}
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
        {session.summary}
      </p>

      <SessionLayout
        main={<SessionContent session={session} progressByBlockId={progressByBlockId} />}
        sidebar={
          <>
            {resumeTarget && (
            <Link
              href={resumeTarget.href}
              className="flex items-center gap-3 rounded-2xl border border-teal/20 bg-teal/5 p-4 transition-colors hover:border-teal/40"
            >
              <span
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal text-porcelain"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium uppercase tracking-wide text-teal-dark">
                  Continue where you left off
                </p>
                <p className="mt-0.5 truncate text-sm font-medium text-ink">
                  {resumeTarget.title}
                  {resumeTarget.duration && (
                    <span className="font-normal text-muted"> &middot; {resumeTarget.duration}</span>
                  )}
                </p>
              </div>
              <span aria-hidden="true" className="shrink-0 text-teal">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </Link>
          )}

          {categoryModules.length > 0 && (
            <CategoryTreeSidebar
              category={session.category}
              categoryHref={`/curriculum?category=${encodeURIComponent(session.category)}`}
              modules={categoryModules}
              currentModuleId={currentModuleId}
              currentSlug={session.slug}
              completionBySlug={completionBySlug}
            />
          )}

          <NotesPanel slug={session.slug} />

          {(prevSession || nextSession) && (
            <div className="flex flex-col gap-2">
              {prevSession && (
                <Link
                  href={`/sessions/${prevSession.slug}`}
                  className="group flex items-center gap-2 rounded-xl border border-ink/10 bg-card p-3 transition-colors hover:border-teal/40"
                >
                  <span aria-hidden="true" className="text-ink/40 group-hover:text-teal">&larr;</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-medium uppercase tracking-wide text-muted">Previous</span>
                    <span className="block truncate text-sm font-medium text-ink group-hover:text-teal">{prevSession.title}</span>
                  </span>
                </Link>
              )}
              {nextSession && (
                <Link
                  href={`/sessions/${nextSession.slug}`}
                  className="group flex items-center gap-2 rounded-xl border border-ink/10 bg-card p-3 text-right transition-colors hover:border-teal/40"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-medium uppercase tracking-wide text-muted">Next</span>
                    <span className="block truncate text-sm font-medium text-ink group-hover:text-teal">{nextSession.title}</span>
                  </span>
                  <span aria-hidden="true" className="text-ink/40 group-hover:text-teal">&rarr;</span>
                </Link>
              )}
            </div>
          )}
          </>
        }
      />
    </article>
  );
}
