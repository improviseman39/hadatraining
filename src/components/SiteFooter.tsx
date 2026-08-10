export default function SiteFooter({
  headerTitle,
  headerSubtitle,
}: {
  headerTitle: string;
  headerSubtitle: string;
}) {
  return (
    <footer className="border-t border-ink/10 bg-porcelain">
      <div className="container-page flex flex-col gap-2 py-10 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p className="font-serif text-base text-ink">
          {headerTitle} {headerSubtitle}
        </p>
        <p>
          &copy; {new Date().getFullYear()} {headerTitle}. For licensed practitioners and
          students.
        </p>
      </div>
    </footer>
  );
}
