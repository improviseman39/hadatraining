"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";

const CATEGORIES = ["Foundations", "Injectables", "Devices", "Safety"] as const;

const PDF_BUCKET = "session-pdfs";
const MAX_PDF_BYTES = 20 * 1024 * 1024;

/**
 * Uploads a PDF from formData's "pdf_file" field, if one was chosen.
 * Returns {} (no-op) if the field is empty — callers fall back to the
 * pasted-URL field in that case.
 */
async function uploadPdfIfProvided(
  supabase: ReturnType<typeof createClient>,
  formData: FormData
): Promise<{ path?: string; error?: string }> {
  const file = formData.get("pdf_file");
  if (!(file instanceof File) || file.size === 0) return {};
  if (file.type !== "application/pdf") return { error: "File must be a PDF." };
  if (file.size > MAX_PDF_BYTES) return { error: "PDF must be under 20MB." };

  const path = `${randomUUID()}.pdf`;
  const { error } = await supabase.storage
    .from(PDF_BUCKET)
    .upload(path, file, { contentType: "application/pdf" });
  if (error) return { error: error.message };
  return { path };
}

function revalidatePublicPages(slug?: string) {
  revalidatePath("/");
  if (slug) revalidatePath(`/sessions/${slug}`);
  revalidatePath("/admin/sessions");
}

export async function createSession(formData: FormData) {
  await requireRole(["admin", "super_admin"]);
  const supabase = createClient();

  const slug = String(formData.get("slug") ?? "").trim();
  const category = String(formData.get("category") ?? "");
  if (!slug || !CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
    return { error: "Slug and a valid category are required." };
  }

  const { data: maxRow } = await supabase
    .from("sessions")
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
    .single();
  const nextPosition = (maxRow?.position ?? 0) + 1;

  const { data: session, error } = await supabase
    .from("sessions")
    .insert({
      slug,
      title: String(formData.get("title") ?? ""),
      category,
      summary: String(formData.get("summary") ?? ""),
      duration: String(formData.get("duration") ?? ""),
      image_id: String(formData.get("image_id") ?? ""),
      is_free: formData.get("is_free") === "on",
      position: nextPosition,
    })
    .select("id")
    .single();

  if (error || !session) {
    return { error: error?.message ?? "Could not create session." };
  }

  revalidatePublicPages(slug);
  redirect(`/admin/sessions/${session.id}`);
}

export async function updateSession(id: string, formData: FormData) {
  await requireRole(["admin", "super_admin"]);
  const supabase = createClient();

  const category = String(formData.get("category") ?? "");
  if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
    return { error: "Invalid category." };
  }

  const { data: existing } = await supabase
    .from("sessions")
    .select("slug")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("sessions")
    .update({
      title: String(formData.get("title") ?? ""),
      category,
      summary: String(formData.get("summary") ?? ""),
      duration: String(formData.get("duration") ?? ""),
      image_id: String(formData.get("image_id") ?? ""),
      is_free: formData.get("is_free") === "on",
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePublicPages(existing?.slug);
  return { success: true };
}

export async function deleteSession(id: string) {
  await requireRole(["admin", "super_admin"]);
  const supabase = createClient();

  const { data: existing } = await supabase
    .from("sessions")
    .select("slug")
    .eq("id", id)
    .single();

  await supabase.from("sessions").delete().eq("id", id);

  revalidatePublicPages(existing?.slug);
}

export async function moveSession(id: string, direction: "up" | "down") {
  await requireRole(["admin", "super_admin"]);
  const supabase = createClient();
  await supabase.rpc("move_session", { p_session_id: id, p_direction: direction });
  revalidatePublicPages();
}

// --- content blocks -------------------------------------------------

export async function addBlock(sessionId: string, formData: FormData) {
  await requireRole(["admin", "super_admin"]);
  const supabase = createClient();

  const type = String(formData.get("type") ?? "");
  if (!["video", "pdf", "text"].includes(type)) {
    return { error: "Invalid block type." };
  }

  const { data: maxRow } = await supabase
    .from("content_blocks")
    .select("position")
    .eq("session_id", sessionId)
    .order("position", { ascending: false })
    .limit(1)
    .single();
  const nextPosition = (maxRow?.position ?? 0) + 1;

  const title = String(formData.get("title") ?? "").trim() || null;
  const payload: Record<string, unknown> = {
    session_id: sessionId,
    type,
    position: nextPosition,
    title,
    video_url: null,
    pdf_url: null,
    pdf_storage_path: null,
    body: null,
  };

  if (type === "video") payload.video_url = String(formData.get("video_url") ?? "").trim() || null;
  if (type === "pdf") {
    const { path, error: uploadError } = await uploadPdfIfProvided(supabase, formData);
    if (uploadError) return { error: uploadError };
    if (path) {
      payload.pdf_storage_path = path;
    } else {
      payload.pdf_url = String(formData.get("pdf_url") ?? "").trim() || null;
    }
  }
  if (type === "text") payload.body = String(formData.get("body") ?? "");

  const { error } = await supabase.from("content_blocks").insert(payload);
  if (error) return { error: error.message };

  const { data: session } = await supabase
    .from("sessions")
    .select("slug")
    .eq("id", sessionId)
    .single();
  revalidatePublicPages(session?.slug);
  revalidatePath(`/admin/sessions/${sessionId}`);
  return { success: true };
}

export async function updateBlock(blockId: string, formData: FormData) {
  await requireRole(["admin", "super_admin"]);
  const supabase = createClient();

  const { data: block } = await supabase
    .from("content_blocks")
    .select("type, session_id, pdf_storage_path")
    .eq("id", blockId)
    .single();
  if (!block) return { error: "Block not found." };

  const title = String(formData.get("title") ?? "").trim() || null;
  const payload: Record<string, unknown> = { title };
  if (block.type === "video") payload.video_url = String(formData.get("video_url") ?? "").trim() || null;
  if (block.type === "pdf") {
    const { path, error: uploadError } = await uploadPdfIfProvided(supabase, formData);
    if (uploadError) return { error: uploadError };
    if (path) {
      payload.pdf_storage_path = path;
      payload.pdf_url = null;
      if (block.pdf_storage_path) {
        await supabase.storage.from(PDF_BUCKET).remove([block.pdf_storage_path]);
      }
    } else {
      const url = String(formData.get("pdf_url") ?? "").trim() || null;
      if (url) {
        payload.pdf_url = url;
        payload.pdf_storage_path = null;
        if (block.pdf_storage_path) {
          await supabase.storage.from(PDF_BUCKET).remove([block.pdf_storage_path]);
        }
      }
    }
  }
  if (block.type === "text") payload.body = String(formData.get("body") ?? "");

  const { error } = await supabase.from("content_blocks").update(payload).eq("id", blockId);
  if (error) return { error: error.message };

  const { data: session } = await supabase
    .from("sessions")
    .select("slug")
    .eq("id", block.session_id)
    .single();
  revalidatePublicPages(session?.slug);
  revalidatePath(`/admin/sessions/${block.session_id}`);
  return { success: true };
}

export async function deleteBlock(blockId: string) {
  await requireRole(["admin", "super_admin"]);
  const supabase = createClient();

  const { data: block } = await supabase
    .from("content_blocks")
    .select("session_id")
    .eq("id", blockId)
    .single();

  await supabase.from("content_blocks").delete().eq("id", blockId);

  if (block) {
    const { data: session } = await supabase
      .from("sessions")
      .select("slug")
      .eq("id", block.session_id)
      .single();
    revalidatePublicPages(session?.slug);
    revalidatePath(`/admin/sessions/${block.session_id}`);
  }
}

export async function moveBlock(
  blockId: string,
  sessionId: string,
  direction: "up" | "down"
) {
  await requireRole(["admin", "super_admin"]);
  const supabase = createClient();
  await supabase.rpc("move_content_block", { p_block_id: blockId, p_direction: direction });

  const { data: session } = await supabase
    .from("sessions")
    .select("slug")
    .eq("id", sessionId)
    .single();
  revalidatePublicPages(session?.slug);
  revalidatePath(`/admin/sessions/${sessionId}`);
}

/** Lets an admin open the currently-attached PDF to confirm what's there before editing/replacing it. */
export async function getPdfPreviewUrl(
  storagePath: string
): Promise<{ url: string; error?: undefined } | { error: string; url?: undefined }> {
  await requireRole(["admin", "super_admin"]);
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(PDF_BUCKET)
    .createSignedUrl(storagePath, 300);
  if (error || !data) return { error: error?.message ?? "Couldn't open that file." };
  return { url: data.signedUrl };
}
