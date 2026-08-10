import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { createAnnouncement } from "@/app/admin/announcements/actions";
import AnnouncementForm from "@/components/admin/AnnouncementForm";

export default async function NewAnnouncementPage() {
  await requireRole(["admin", "super_admin"]);
  return (
    <div>
      <Link
        href="/admin/announcements"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-teal"
      >
        &larr; Back to announcements
      </Link>
      <h2 className="mb-6 font-serif text-xl text-ink">New announcement</h2>
      <div className="max-w-xl rounded-2xl border border-ink/10 bg-card p-6 shadow-sm sm:p-7">
        <AnnouncementForm action={createAnnouncement} submitLabel="Create announcement" />
      </div>
    </div>
  );
}
