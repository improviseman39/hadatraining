import Image from "next/image";
import Link from "next/link";
import type { Session } from "@/types/content";

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/** Desktop-only companion to the mobile jump-link banner + bottom grid — a
 * compact, always-visible list so sub-topics don't require any scrolling
 * or clicking to notice on wide screens. When viewing a sub-topic itself
 * (`parentSession` set), the main session gets its own row at the top of
 * the same box — not just a small link above it — so it's never missing
 * from the list while browsing between sub-topics. */
export default function SubTopicsSidebar({
  subTopics,
  currentSlug,
  parentSession,
}: {
  subTopics: Session[];
  currentSlug?: string;
  /** Set only when viewing a sub-topic — the main session it belongs to. */
  parentSession?: { slug: string; title: string; imageUrl: string } | null;
}) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-card p-4 shadow-sm">
      {parentSession ? (
        <>
          <Link
            href={`/sessions/${parentSession.slug}`}
            className="mb-3 flex items-center gap-3 rounded-xl border-b border-ink/10 p-2 pb-3 transition-colors hover:bg-porcelain"
          >
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-porcelain">
              <Image src={parentSession.imageUrl} alt="" fill sizes="40px" className="object-cover" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-medium uppercase tracking-wide text-muted">Main session</div>
              <div className="truncate font-serif text-sm text-ink">{parentSession.title}</div>
            </div>
          </Link>
          <p className="px-1 text-xs text-muted">
            {subTopics.length} sub-topic{subTopics.length > 1 ? "s" : ""}
          </p>
        </>
      ) : (
        <>
          <h2 className="px-1 font-serif text-base text-ink">Inside this session</h2>
          <p className="px-1 mt-1 text-xs text-muted">
            {subTopics.length} sub-topic{subTopics.length > 1 ? "s" : ""}
          </p>
        </>
      )}
      <ul className="mt-3 flex flex-col gap-1">
        {subTopics.map((subTopic, index) => {
          const isCurrent = subTopic.slug === currentSlug;
          return (
            <li key={subTopic.slug}>
              <Link
                href={`/sessions/${subTopic.slug}`}
                aria-current={isCurrent ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl p-2 text-sm transition-colors ${
                  isCurrent
                    ? "bg-teal/10 text-teal-dark font-medium"
                    : "text-ink/80 hover:bg-porcelain hover:text-teal"
                }`}
              >
                <div className="relative h-[30px] w-[30px] shrink-0 overflow-hidden rounded-lg bg-porcelain">
                  <Image src={subTopic.imageUrl} alt="" fill sizes="30px" className="object-cover" />
                </div>
                <span className="min-w-0 flex-1 truncate">
                  <span className="mr-1.5 text-xs font-medium text-muted">{pad(index + 1)}</span>
                  {subTopic.title}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
