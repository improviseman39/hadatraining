"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const MAX_MESSAGE_LENGTH = 2000;

export async function submitRequest(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be signed in to send a request." };

  const message = String(formData.get("message") ?? "").trim();
  if (!message) return { error: "Please enter a message." };
  if (message.length > MAX_MESSAGE_LENGTH) {
    return { error: "That message is too long." };
  }

  const { error } = await supabase
    .from("requests")
    .insert({ user_id: user.id, message });

  if (error) return { error: error.message };

  revalidatePath("/admin/requests");
  return { success: true };
}

/**
 * Posts a follow-up message on an existing request thread. Used by both
 * the requester's own widget and the admin reply form — RLS on
 * request_messages (not role logic here) decides who may post to which
 * thread.
 */
export async function sendRequestMessage(requestId: string, formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be signed in to reply." };

  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "Please enter a message." };
  if (body.length > MAX_MESSAGE_LENGTH) {
    return { error: "That message is too long." };
  }

  const { data: request } = await supabase
    .from("requests")
    .select("id, user_id, status")
    .eq("id", requestId)
    .single();
  if (!request) return { error: "Request not found." };

  const { error } = await supabase
    .from("request_messages")
    .insert({ request_id: requestId, sender_id: user.id, body });

  if (error) return { error: error.message };

  // If the original requester replies after staff marked this resolved,
  // resurface it in the admin inbox instead of leaving it silently closed.
  // requests has no UPDATE policy for a plain owner, so this goes through
  // the narrow reopen_own_request() RPC rather than a direct .update()
  // (which RLS would silently drop with 0 rows affected, no error).
  if (request.user_id === user.id && request.status === "resolved") {
    await supabase.rpc("reopen_own_request", { request_id: requestId });
  }

  revalidatePath("/admin/requests");
  return { success: true };
}
