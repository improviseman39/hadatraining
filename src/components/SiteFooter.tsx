"use client";

import Link from "next/link";
import { useRequestWidget } from "@/context/RequestWidgetContext";

const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  Instagram: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" />
    </svg>
  ),
  LINE: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M12 3C6.8 3 3 6.4 3 10.5c0 3.3 2.6 6.1 6.3 7.2-.2.8-.9 3-.9 3.1 0 0 0 .3.2.4.2.1.3 0 .4-.1 1.7-1.1 3.7-2.5 4.3-2.9.9.1 1.8.2 2.7.2 5.2 0 9-3.4 9-7.5S17.2 3 12 3z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Threads: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M16.5 7.5c-1-1-2.3-1.5-4-1.5-3.3 0-5.5 2.4-5.5 6s2.2 6 5.6 6c2.6 0 4.1-1.2 4.6-3.2.3-1.1.1-2.1-.6-2.8-.6-.6-1.6-.9-2.8-.9-1.1 0-2.2.3-2.9.9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  ),
};

export default function SiteFooter({
  headerTitle,
  headerSubtitle,
  instagramUrl,
  lineUrl,
  threadsUrl,
}: {
  headerTitle: string;
  headerSubtitle: string;
  instagramUrl?: string | null;
  lineUrl?: string | null;
  threadsUrl?: string | null;
}) {
  const socialLinks = [
    { label: "Instagram", href: instagramUrl },
    { label: "LINE", href: lineUrl },
    { label: "Threads", href: threadsUrl },
  ].filter((link): link is { label: string; href: string } => Boolean(link.href));
  const { openWidget } = useRequestWidget();

  return (
    <footer className="border-t border-ink/10 bg-porcelain">
      <div className="container-page flex flex-col gap-10 py-12 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-serif text-base text-ink">
            {headerTitle} {headerSubtitle}
          </p>
          <p className="mt-1 text-sm text-muted">
            &copy; {new Date().getFullYear()} {headerTitle}. For licensed practitioners and
            students.
          </p>
        </div>

        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-16">
          <nav className="flex flex-col gap-2 text-sm text-muted">
            <Link href="/about" className="transition-colors hover:text-teal">
              About HADA
            </Link>
            <Link href="/faculty" className="transition-colors hover:text-teal">
              Faculty
            </Link>
            <Link href="/#faq" className="transition-colors hover:text-teal">
              FAQ
            </Link>
            <button
              type="button"
              onClick={openWidget}
              className="text-left transition-colors hover:text-teal"
            >
              Contact us
            </button>
          </nav>

          <div className="flex flex-col gap-4">
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-3">
                {socialLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={link.label}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/15 text-ink/70 transition-colors hover:border-teal hover:text-teal"
                  >
                    {SOCIAL_ICONS[link.label]}
                  </a>
                ))}
              </div>
            )}
            <div className="flex items-center gap-4 text-sm text-muted">
              <Link href="/privacy-policy" className="transition-colors hover:text-teal hover:underline">
                Privacy policy
              </Link>
              <Link href="/terms-of-use" className="transition-colors hover:text-teal hover:underline">
                Terms of use
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
