export default function SiteFooter() {
  return (
    <footer className="border-t border-ink/10 bg-porcelain">
      <div className="container-page flex flex-col gap-2 py-10 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p className="font-serif text-base text-ink">HADA Aesthetic Training</p>
        <p>&copy; {new Date().getFullYear()} HADA. For licensed practitioners and students.</p>
      </div>
    </footer>
  );
}
