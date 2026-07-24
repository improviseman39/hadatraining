"use client";

/**
 * A plain `<a href="#sub-topics">` is unreliable here — the page has client
 * components below (video/PDF players, notes) that hydrate a moment after
 * first paint, and the browser's native hash-jump can race that hydration
 * and land short. Scrolling explicitly on click sidesteps that.
 */
export default function SubTopicsBanner({ count }: { count: number }) {
  function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    document.getElementById("sub-topics")?.scrollIntoView({ behavior: "smooth" });
    history.replaceState(null, "", "#sub-topics");
  }

  return (
    <a
      href="#sub-topics"
      onClick={handleClick}
      className="mt-5 inline-flex items-center gap-2 rounded-full border border-teal/30 bg-teal/10 px-4 py-2 text-sm font-medium text-teal-dark transition-colors hover:border-teal"
    >
      This session includes {count} sub-topic{count > 1 ? "s" : ""}
      <span aria-hidden="true">&darr;</span>
    </a>
  );
}
