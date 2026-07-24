import Image from "next/image";
import Link from "next/link";
import type { Session } from "@/types/content";

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/** Desktop-only companion to the mobile jump-link banner + bottom grid — a
 * compact, always-visible list so sub-topics don't require any scrolling
 * or clicking to notice on wide screens. Also used (with `currentSlug` set)
 * when viewing a sub-topic itself, listing its siblings so the list stays
 * visible while browsing between them instead of only showing on the
 * parent's page. */
export default function SubTopicsSidebar({
  subTopics,
  currentSlug,
  heading = "Inside this session",
}: {
  subTopics: Session[];
  currentSlug?: string;
  heading?: string;
}) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-card p-4 shadow-sm">
      <h2 className="px-1 font-serif text-base text-ink">{heading}</h2>
      <p className="px-1 mt-1 text-xs text-muted">
        {subTopics.length} sub-topic{subTopics.length > 1 ? "s" : ""}
      </p>
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
                    ? "bg-teal/10 text-teal-dark"
                    : "text-ink/80 hover:bg-porcelain hover:text-teal"
                }`}
              >
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-porcelain">
                  <Image src={subTopic.imageUrl} alt="" fill sizes="40px" className="object-cover" />
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
