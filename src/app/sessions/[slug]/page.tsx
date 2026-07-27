import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapSession, mapSessionWithBlocks } from "@/lib/supabase/mappers";
import SessionContent from "@/components/SessionContent";
import SessionCard from "@/components/SessionCard";
import SubTopicsBanner from "@/components/SubTopicsBanner";
import SubTopicsSidebar from "@/components/SubTopicsSidebar";
import type { SessionWithBlocks } from "@/types/content";

type Crumb = { slug: string; title: string };

/** Walks parent_id upward to build a breadcrumb — arbitrary depth, so this
 * loops rather than assuming a fixed number of levels. */
async function buildBreadcrumb(
  supabase: ReturnType<typeof createClient>,
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

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const supabase = createClient();
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

export default async function SessionPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();

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

  // Prev/next only makes sense for top-level sessions — a sub-topic is
  // discovered by browsing into its parent's page instead, via the
  // breadcrumb and sub-topics list below, not a linear chain.
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
  }

  const breadcrumb = await buildBreadcrumb(supabase, session.parentId);

  const { data: childRows } = await supabase
    .from("sessions")
    .select("*")
    .eq("parent_id", session.id)
    .order("position");
  const children = (childRows ?? []).map(mapSession);

  // Viewing a sub-topic itself has no children of its own — show its
  // siblings instead (including itself, highlighted), fetched via the
  // shared parent, so the list of "other sessions in here" stays visible
  // no matter which sub-topic you're currently on. The main session also
  // gets its own row in that same list (not just a small link above it),
  // fetched in full since the sidebar shows its photo too.
  let siblings: typeof children = [];
  let parentSession: typeof children[number] | null = null;
  if (children.length === 0 && session.parentId) {
    const [{ data: siblingRows }, { data: parentRow }] = await Promise.all([
      supabase.from("sessions").select("*").eq("parent_id", session.parentId).order("position"),
      supabase.from("sessions").select("*").eq("id", session.parentId).single(),
    ]);
    siblings = (siblingRows ?? []).map(mapSession);
    parentSession = parentRow ? mapSession(parentRow) : null;
  }

  const subTopics = children.length > 0 ? children : siblings;
  const isSiblingList = children.length === 0 && siblings.length > 0;
  const parentTitle = parentSession?.title ?? null;

  return (
    <article>
      <div className="relative h-64 w-full overflow-hidden border-b border-ink/10 sm:h-80">
        <Image
          src={session.imageUrl}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/40 to-ink/10" />
        <div className="container-page relative flex h-full flex-col justify-end pb-8">
          <div className="absolute top-6 flex w-fit flex-wrap items-center gap-2 text-sm font-medium text-porcelain">
            <Link
              href="/#curriculum"
              className="flex items-center gap-1.5 rounded-full border border-porcelain/30 bg-ink/40 px-3 py-1.5 backdrop-blur-sm transition-colors hover:border-teal hover:bg-ink/60"
            >
              <span aria-hidden="true">&larr;</span> Back to curriculum
            </Link>
            {breadcrumb.map((crumb) => (
              <span key={crumb.slug} className="flex items-center gap-1.5 text-porcelain/90">
                <span aria-hidden="true" className="text-porcelain/40">/</span>
                <Link href={`/sessions/${crumb.slug}`} className="transition-colors hover:text-teal">
                  {crumb.title}
                </Link>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <span className="font-serif text-3xl text-porcelain/50 sm:text-4xl">
              {pad(session.position)}
            </span>
            <span className="rounded-full border border-porcelain/30 px-3 py-1 text-xs font-medium uppercase tracking-wide text-porcelain/90">
              {session.category}
            </span>
            {session.duration && (
              <span className="text-xs font-medium uppercase tracking-wide text-porcelain/70">
                {session.duration}
              </span>
            )}
            {!session.isFree && (
              <span className="flex items-center gap-1.5 rounded-full bg-terracotta/90 px-3 py-1 text-xs font-medium text-porcelain">
                Members only
              </span>
            )}
          </div>
          <h1 className="mt-3 font-serif text-3xl font-medium text-porcelain sm:text-4xl lg:text-5xl">
            {session.title}
          </h1>
        </div>
      </div>

      <div className="container-page py-12 sm:py-16">
        <div className={subTopics.length > 0 ? "lg:grid lg:grid-cols-[280px_1fr] lg:items-start lg:gap-10" : undefined}>
          {subTopics.length > 0 && (
            <aside className="hidden lg:sticky lg:top-24 lg:block">
              <SubTopicsSidebar
                subTopics={subTopics}
                currentSlug={session.slug}
                parentSession={isSiblingList ? parentSession : null}
              />
            </aside>
          )}

          <div className="min-w-0">
            <p className="max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
              {session.summary}
            </p>

            {subTopics.length > 0 && (
              <div className="lg:hidden">
                <SubTopicsBanner
                  count={subTopics.length}
                  label={isSiblingList ? `More in ${parentTitle}` : undefined}
                />
              </div>
            )}

            <div className="mt-10 sm:mt-12">
              <SessionContent session={session} />
            </div>
          </div>
        </div>

        {subTopics.length > 0 && (
          <div id="sub-topics" className="mt-16 scroll-mt-24 border-t border-ink/10 pt-10 sm:mt-20 lg:hidden">
            {isSiblingList && parentSession && (
              <Link
                href={`/sessions/${parentSession.slug}`}
                className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-teal transition-colors hover:text-teal-dark"
              >
                <span aria-hidden="true">&larr;</span> Back to {parentSession.title}
              </Link>
            )}
            <h2 className="font-serif text-2xl text-ink">
              {isSiblingList && parentTitle ? `More in ${parentTitle}` : "Inside this session"}
            </h2>
            <p className="mt-2 text-sm text-muted">
              {subTopics.length} sub-topic{subTopics.length > 1 ? "s" : ""}
            </p>
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {subTopics.map((subTopic) => (
                <SessionCard key={subTopic.slug} session={subTopic} />
              ))}
            </div>
          </div>
        )}

        <nav className="mt-16 flex flex-col gap-4 border-t border-ink/10 pt-8 sm:mt-20 sm:flex-row sm:items-center sm:justify-between">
          {prevSession ? (
            <Link
              href={`/sessions/${prevSession.slug}`}
              className="group flex flex-1 flex-col rounded-xl border border-ink/10 p-4 transition-colors hover:border-teal/40 sm:p-5"
            >
              <span className="text-xs font-medium uppercase tracking-wide text-muted">
                &larr; Previous
              </span>
              <span className="mt-1 font-serif text-lg text-ink group-hover:text-teal">
                {prevSession.title}
              </span>
            </Link>
          ) : (
            <div className="flex-1" />
          )}
          {nextSession ? (
            <Link
              href={`/sessions/${nextSession.slug}`}
              className="group flex flex-1 flex-col rounded-xl border border-ink/10 p-4 text-right transition-colors hover:border-teal/40 sm:p-5"
            >
              <span className="text-xs font-medium uppercase tracking-wide text-muted">
                Next &rarr;
              </span>
              <span className="mt-1 font-serif text-lg text-ink group-hover:text-teal">
                {nextSession.title}
              </span>
            </Link>
          ) : (
            <div className="flex-1" />
          )}
        </nav>
      </div>
    </article>
  );
}
