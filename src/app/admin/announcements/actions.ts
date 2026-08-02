"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";

const CATEGORIES = ["Seminar", "News", "Event"] as const;

function revalidatePublicPages() {
  revalidatePath("/");
  revalidatePath("/admin/announcements");
}

/**
 * Slots a brand-new announcement into date order (soonest-upcoming-first)
 * relative to whatever's already there, without disturbing the existing
 * items' order relative to each other — admins can still freely reorder
 * anything afterward via moveAnnouncement, which always has the final say.
 * Only used at creation time; editing an existing announcement's date
 * deliberately does not re-slot it, since that could silently undo a
 * manual reorder over an unrelated edit.
 */
async function insertAtDateSortedPosition(
  supabase: Awaited<ReturnType<typeof createClient>>,
  newDate: string
): Promise<number> {
  const { data: existing } = await supabase
    .from("announcements")
    .select("id, position, date")
    .order("position");
  const rows = existing ?? [];

  const insertBeforeIndex = rows.findIndex((row: { date: string }) => row.date > newDate);
  if (insertBeforeIndex === -1) {
    return (rows.at(-1)?.position ?? 0) + 1;
  }

  // Shift this row and everything after it up by one, starting from the
  // end, so no two rows ever momentarily want the same position.
  for (let i = rows.length - 1; i >= insertBeforeIndex; i--) {
    await supabase
      .from("announcements")
      .update({ position: rows[i].position + 1 })
      .eq("id", rows[i].id);
  }
  return rows[insertBeforeIndex].position;
}

export async function createAnnouncement(formData: FormData) {
  await requireRole(["admin", "super_admin"]);
  const supabase = await createClient();

  const category = String(formData.get("category") ?? "");
  if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
    return { error: "Invalid category." };
  }

  const date = String(formData.get("date") ?? "");
  const endDate = String(formData.get("end_date") ?? "").trim() || null;
  const alwaysVisible = formData.get("always_visible") === "on";
  const nextPosition = await insertAtDateSortedPosition(supabase, date);

  const href = String(formData.get("href") ?? "").trim() || null;
  const imageStoragePath = String(formData.get("image_storage_path") ?? "").trim() || null;
  const imageId = String(formData.get("image_id") ?? "").trim() || null;
  if (!imageStoragePath && !imageId) {
    return { error: "Upload an image or provide an Unsplash photo id." };
  }
  const videoUrl = String(formData.get("video_url") ?? "").trim() || null;

  const { error } = await supabase.from("announcements").insert({
    category,
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    date,
    end_date: endDate,
    always_visible: alwaysVisible,
    image_id: imageStoragePath ? null : imageId,
    image_storage_path: imageStoragePath,
    video_url: videoUrl,
    href,
    position: nextPosition,
  });

  if (error) return { error: error.message };

  revalidatePublicPages();
  redirect("/admin/announcements");
}

export async function updateAnnouncement(id: string, formData: FormData) {
  await requireRole(["admin", "super_admin"]);
  const supabase = await createClient();

  const category = String(formData.get("category") ?? "");
  if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
    return { error: "Invalid category." };
  }

  const href = String(formData.get("href") ?? "").trim() || null;
  const imageStoragePath = String(formData.get("image_storage_path") ?? "").trim() || null;
  const imageId = String(formData.get("image_id") ?? "").trim() || null;
  if (!imageStoragePath && !imageId) {
    return { error: "Upload an image or provide an Unsplash photo id." };
  }
  const videoUrl = String(formData.get("video_url") ?? "").trim() || null;

  const { data: existing } = await supabase
    .from("announcements")
    .select("image_storage_path")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("announcements")
    .update({
      category,
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      date: String(formData.get("date") ?? ""),
      end_date: String(formData.get("end_date") ?? "").trim() || null,
      always_visible: formData.get("always_visible") === "on",
      image_id: imageStoragePath ? null : imageId,
      image_storage_path: imageStoragePath,
      video_url: videoUrl,
      href,
    })
    .eq("id", id);

  if (!error && existing?.image_storage_path && existing.image_storage_path !== imageStoragePath) {
    await supabase.storage.from("announcement-images").remove([existing.image_storage_path]);
  }

  if (error) return { error: error.message };

  revalidatePublicPages();
  return { success: true };
}

export async function deleteAnnouncement(id: string) {
  await requireRole(["admin", "super_admin"]);
  const supabase = await createClient();
  await supabase.from("announcements").delete().eq("id", id);
  revalidatePublicPages();
}

export async function moveAnnouncement(id: string, direction: "up" | "down") {
  await requireRole(["admin", "super_admin"]);
  const supabase = await createClient();

  const { data: current } = await supabase
    .from("announcements")
    .select("position")
    .eq("id", id)
    .single();
  if (!current) return;

  const query = supabase.from("announcements").select("id, position");
  const { data: target } = await (
    direction === "up"
      ? query.lt("position", current.position).order("position", { ascending: false })
      : query.gt("position", current.position).order("position", { ascending: true })
  )
    .limit(1)
    .single();

  if (!target) return;

  await supabase.from("announcements").update({ position: target.position }).eq("id", id);
  await supabase.from("announcements").update({ position: current.position }).eq("id", target.id);

  revalidatePublicPages();
}
