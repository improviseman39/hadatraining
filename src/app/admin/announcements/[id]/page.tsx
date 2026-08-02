import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateAnnouncement } from "@/app/admin/announcements/actions";
import AnnouncementForm from "@/components/admin/AnnouncementForm";

export const dynamic = "force-dynamic";

export default async function EditAnnouncementPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: announcement, error } = await supabase
    .from("announcements")
    .select("*")
    .eq("id", params.id)
    .single();
  if (error || !announcement) notFound();

  return (
    <div>
      <Link
        href="/admin/announcements"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-teal"
      >
        &larr; Back to announcements
      </Link>
      <h2 className="mb-6 font-serif text-xl text-ink">Edit: {announcement.title}</h2>
      <div className="max-w-xl rounded-2xl border border-ink/10 bg-card p-6 shadow-sm sm:p-7">
        <AnnouncementForm
          action={updateAnnouncement.bind(null, announcement.id)}
          defaultValues={announcement}
          submitLabel="Save changes"
        />
      </div>
    </div>
  );
}
