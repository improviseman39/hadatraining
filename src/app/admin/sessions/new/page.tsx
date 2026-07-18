import Link from "next/link";
import { createSession } from "@/app/admin/sessions/actions";
import SessionForm from "@/components/admin/SessionForm";

export default function NewSessionPage() {
  return (
    <div>
      <Link
        href="/admin/sessions"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-teal"
      >
        &larr; Back to sessions
      </Link>
      <h2 className="mb-6 font-serif text-xl text-ink">New session</h2>
      <div className="max-w-2xl rounded-2xl border border-ink/10 bg-card p-6 shadow-sm sm:p-7">
        <SessionForm action={createSession} submitLabel="Create session" />
      </div>
    </div>
  );
}
