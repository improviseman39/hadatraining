import Link from "next/link";
import type { Session } from "@/types/content";

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/** Desktop-only companion to the mobile jump-link banner + bottom grid — a
 * compact, always-visible list so sub-topics don't require any scrolling
 * or clicking to notice on wide screens. */
export default function SubTopicsSidebar({ subTopics }: { subTopics: Session[] }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-card p-5 shadow-sm">
      <h2 className="font-serif text-base text-ink">Inside this session</h2>
      <p className="mt-1 text-xs text-muted">
        {subTopics.length} sub-topic{subTopics.length > 1 ? "s" : ""}
      </p>
      <ul className="mt-4 flex flex-col gap-1">
        {subTopics.map((subTopic, index) => (
          <li key={subTopic.slug}>
            <Link
              href={`/sessions/${subTopic.slug}`}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-ink/80 transition-colors hover:bg-porcelain hover:text-teal"
            >
              <span className="text-xs font-medium text-muted">{pad(index + 1)}</span>
              <span className="truncate">{subTopic.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
