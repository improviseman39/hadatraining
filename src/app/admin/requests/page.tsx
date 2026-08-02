import { createClient } from "@/lib/supabase/server";
import LocalDateTime from "@/components/LocalDateTime";
import ActionButton from "@/components/admin/ActionButton";
import { markRequestResolved, markRequestNew, deleteRequest } from "./actions";
import { sendRequestMessage } from "@/lib/actions/requests";

export const dynamic = "force-dynamic";

type RequestMessage = {
  id: string;
  request_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export default async function AdminRequestsPage() {
  const supabase = await createClient();

  const [{ data: requests }, { data: profiles }, { data: messages }] = await Promise.all([
    supabase
      .from("requests")
      .select("id, user_id, message, status, created_at")
      .order("status", { ascending: true })
      .order("created_at", { ascending: false }),
    supabase.rpc("list_profiles_for_booking"),
    supabase
      .from("request_messages")
      .select("id, request_id, sender_id, body, created_at")
      .order("created_at", { ascending: true }),
  ]);

  const emailById = new Map<string, string>(
    (profiles ?? []).map((p: { id: string; email: string }) => [p.id, p.email])
  );

  const messagesByRequestId = new Map<string, RequestMessage[]>();
  for (const m of (messages ?? []) as RequestMessage[]) {
    const list = messagesByRequestId.get(m.request_id) ?? [];
    list.push(m);
    messagesByRequestId.set(m.request_id, list);
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-serif text-xl text-ink">Requests</h2>
      </div>

      <div className="flex flex-col gap-4">
        {(requests ?? []).length === 0 && (
          <p className="text-sm text-muted">No requests yet.</p>
        )}

        {(requests ?? []).map((request) => {
          const isNew = request.status === "new";
          return (
            <div
              key={request.id}
              className="rounded-2xl border border-ink/10 bg-card p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      isNew
                        ? "bg-teal/10 text-teal"
                        : "bg-porcelain text-muted"
                    }`}
                  >
                    {isNew ? "New" : "Resolved"}
                  </span>
                  <span className="text-sm font-medium text-ink">
                    {emailById.get(request.user_id) ?? "Unknown user"}
                  </span>
                </div>
                <span className="text-xs text-muted">
                  <LocalDateTime value={request.created_at} />
                </span>
              </div>

              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink">
                {request.message}
              </p>

              {(messagesByRequestId.get(request.id) ?? []).length > 0 && (
                <div className="mt-4 flex flex-col gap-3 border-t border-ink/10 pt-4">
                  {(messagesByRequestId.get(request.id) ?? []).map((m) => (
                    <div key={m.id} className="text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-ink">
                          {emailById.get(m.sender_id) ?? "Unknown user"}
                        </span>
                        <span className="text-xs text-muted">
                          <LocalDateTime value={m.created_at} />
                        </span>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap leading-relaxed text-ink">
                        {m.body}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <form
                action={async (formData: FormData) => {
                  "use server";
                  await sendRequestMessage(request.id, formData);
                }}
                className="mt-4 flex items-start gap-2"
              >
                <textarea
                  name="body"
                  required
                  rows={2}
                  placeholder="Reply to this request…"
                  className="w-full resize-y rounded-lg border border-ink/15 bg-porcelain px-3 py-2 text-sm text-ink placeholder:text-muted/60 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-full bg-teal px-4 py-2 text-xs font-medium text-porcelain transition-colors hover:bg-teal-dark"
                >
                  Reply
                </button>
              </form>

              <div className="mt-4 flex items-center justify-end gap-1.5">
                <ActionButton
                  action={(isNew ? markRequestResolved : markRequestNew).bind(null, request.id)}
                  className="rounded-full border border-ink/15 px-3 py-1 text-xs font-medium text-ink transition-colors hover:border-teal hover:text-teal"
                >
                  {isNew ? "Mark resolved" : "Reopen"}
                </ActionButton>
                <ActionButton
                  action={deleteRequest.bind(null, request.id)}
                  confirmMessage="Delete this request?"
                  className="rounded-full border border-ink/15 px-3 py-1 text-xs font-medium text-terracotta transition-colors hover:border-terracotta"
                >
                  Delete
                </ActionButton>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
