import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { unsplashUrl } from "@/data/sessions";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapSessionWithBlocks } from "@/lib/supabase/mappers";
import SessionContent from "@/components/SessionContent";
import type { SessionWithBlocks } from "@/types/content";

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

  const { data: neighborRows } = await supabase
    .from("sessions")
    .select("slug, title, position")
    .order("position");
  const neighbors = neighborRows ?? [];
  const currentIndex = neighbors.findIndex((s) => s.slug === session.slug);
  const prevSession = currentIndex > 0 ? neighbors[currentIndex - 1] : null;
  const nextSession =
    currentIndex >= 0 && currentIndex < neighbors.length - 1
      ? neighbors[currentIndex + 1]
      : null;

  return (
    <article>
      <div className="relative h-64 w-full overflow-hidden border-b border-ink/10 sm:h-80">
        <Image
          src={unsplashUrl(session.imageId, 1600, 70)}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/40 to-ink/10" />
        <div className="container-page relative flex h-full flex-col justify-end pb-8">
          <Link
            href="/#curriculum"
            className="absolute top-6 inline-flex w-fit items-center gap-2 text-sm font-medium text-porcelain/90 transition-colors hover:text-teal"
          >
            <span aria-hidden="true">&larr;</span>
            Back to curriculum
          </Link>
          <div className="flex items-center gap-4">
            <span className="font-serif text-3xl text-porcelain/50 sm:text-4xl">
              {pad(session.position)}
            </span>
            <span className="rounded-full border border-porcelain/30 px-3 py-1 text-xs font-medium uppercase tracking-wide text-porcelain/90">
              {session.category}
            </span>
            <span className="text-xs font-medium uppercase tracking-wide text-porcelain/70">
              {session.duration}
            </span>
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
        <p className="max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
          {session.summary}
        </p>

        <div className="mt-10 sm:mt-12">
          <SessionContent session={session} />
        </div>

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
