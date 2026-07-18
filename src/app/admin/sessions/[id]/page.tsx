import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateSession } from "@/app/admin/sessions/actions";
import SessionForm from "@/components/admin/SessionForm";
import BlockEditor from "@/components/admin/BlockEditor";

export const dynamic = "force-dynamic";

export default async function EditSessionPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: session, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", params.id)
    .single();
  if (error || !session) notFound();

  const { data: blocks } = await supabase
    .from("content_blocks")
    .select("*")
    .eq("session_id", params.id)
    .order("position");

  return (
    <div>
      <Link
        href="/admin/sessions"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-teal"
      >
        &larr; Back to sessions
      </Link>
      <h2 className="mb-6 font-serif text-xl text-ink">Edit: {session.title}</h2>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-ink/10 bg-card p-6 shadow-sm sm:p-7">
          <h3 className="mb-4 font-serif text-lg text-ink">Session details</h3>
          <SessionForm
            action={updateSession.bind(null, session.id)}
            defaultValues={session}
            submitLabel="Save changes"
            lockSlug
          />
        </div>

        <div>
          <h3 className="mb-4 font-serif text-lg text-ink">Content blocks</h3>
          <BlockEditor sessionId={session.id} blocks={blocks ?? []} />
        </div>
      </div>
    </div>
  );
}
