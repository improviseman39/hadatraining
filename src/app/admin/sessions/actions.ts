"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";

const CATEGORIES = ["Foundations", "Injectables", "Devices", "Safety"] as const;

const PDF_BUCKET = "session-pdfs";

function revalidatePublicPages(slug?: string) {
  revalidatePath("/");
  if (slug) revalidatePath(`/sessions/${slug}`);
  revalidatePath("/admin/sessions");
}

export async function createSession(formData: FormData) {
  await requireRole(["admin", "super_admin"]);
  const supabase = createClient();

  const slug = String(formData.get("slug") ?? "").trim();
  const parentId = String(formData.get("parent_id") ?? "").trim() || null;
  let category = String(formData.get("category") ?? "");

  if (parentId) {
    // Sub-topics inherit their parent's category — they don't appear on the
    // category-grouped curriculum grid themselves, so it's not a decision
    // that needs its own UI, just internal consistency.
    const { data: parent } = await supabase
      .from("sessions")
      .select("category")
      .eq("id", parentId)
      .single();
    if (!parent) return { error: "Parent session not found." };
    category = parent.category;
  }

  if (!slug || !CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
    return { error: "Slug and a valid category are required." };
  }

  const imageStoragePath = String(formData.get("image_storage_path") ?? "").trim() || null;
  const imageId = String(formData.get("image_id") ?? "").trim() || null;
  if (!imageStoragePath && !imageId) {
    return { error: "Upload an image or provide an Unsplash photo id." };
  }

  const siblingQuery = supabase.from("sessions").select("position");
  const { data: maxRow } = await (
    parentId ? siblingQuery.eq("parent_id", parentId) : siblingQuery.is("parent_id", null)
  )
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
      duration: String(formData.get("duration") ?? "").trim() || null,
      image_id: imageStoragePath ? null : imageId,
      image_storage_path: imageStoragePath,
      is_free: formData.get("is_free") === "on",
      position: nextPosition,
      parent_id: parentId,
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
    .select("slug, image_storage_path")
    .eq("id", id)
    .single();

  const imageStoragePath = String(formData.get("image_storage_path") ?? "").trim() || null;
  const imageId = String(formData.get("image_id") ?? "").trim() || null;
  if (!imageStoragePath && !imageId) {
    return { error: "Upload an image or provide an Unsplash photo id." };
  }

  // Only present when the form included a "Parent session" selector (it
  // always does, from the admin edit page) — an empty value means "make
  // this a top-level session."
  const hasParentField = formData.has("parent_id");
  const newParentId = String(formData.get("parent_id") ?? "").trim() || null;
  if (newParentId === id) return { error: "A session can't be its own parent." };

  const payload: Record<string, unknown> = {
    title: String(formData.get("title") ?? ""),
    category,
    summary: String(formData.get("summary") ?? ""),
    duration: String(formData.get("duration") ?? "").trim() || null,
    image_id: imageStoragePath ? null : imageId,
    image_storage_path: imageStoragePath,
  };
  if (hasParentField) payload.parent_id = newParentId;
  // Only a top-level session's is_free is directly editable — a sub-topic's
  // is_free is always inherited from its ancestor (kept in sync by a DB
  // trigger), so there's no independent value to save for it here.
  if (!newParentId) {
    payload.is_free = formData.get("is_free") === "on";
  }

  const { error } = await supabase.from("sessions").update(payload).eq("id", id);

  if (!error && existing?.image_storage_path && existing.image_storage_path !== imageStoragePath) {
    await supabase.storage.from("session-images").remove([existing.image_storage_path]);
  }

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
    const storagePath = String(formData.get("pdf_storage_path") ?? "").trim() || null;
    if (storagePath) {
      payload.pdf_storage_path = storagePath;
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
    const storagePath = String(formData.get("pdf_storage_path") ?? "").trim() || null;
    const url = String(formData.get("pdf_url") ?? "").trim() || null;
    if (storagePath) {
      payload.pdf_storage_path = storagePath;
      payload.pdf_url = null;
      if (block.pdf_storage_path && block.pdf_storage_path !== storagePath) {
        await supabase.storage.from(PDF_BUCKET).remove([block.pdf_storage_path]);
      }
    } else if (url) {
      payload.pdf_url = url;
      payload.pdf_storage_path = null;
      if (block.pdf_storage_path) {
        await supabase.storage.from(PDF_BUCKET).remove([block.pdf_storage_path]);
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
