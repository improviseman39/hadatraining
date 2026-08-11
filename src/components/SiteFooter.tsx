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

  return (
    <footer className="border-t border-ink/10 bg-porcelain">
      <div className="container-page flex flex-col gap-4 py-10 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-serif text-base text-ink">
            {headerTitle} {headerSubtitle}
          </p>
          <p className="mt-1">
            &copy; {new Date().getFullYear()} {headerTitle}. For licensed practitioners and
            students.
          </p>
        </div>
        {socialLinks.length > 0 && (
          <div className="flex items-center gap-4">
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-ink/70 underline-offset-4 transition-colors hover:text-teal hover:underline"
              >
                {link.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </footer>
  );
}
