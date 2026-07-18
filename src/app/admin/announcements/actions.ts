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

export async function createAnnouncement(formData: FormData) {
  await requireRole(["admin", "super_admin"]);
  const supabase = createClient();

  const category = String(formData.get("category") ?? "");
  if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
    return { error: "Invalid category." };
  }

  const { data: maxRow } = await supabase
    .from("announcements")
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
    .single();
  const nextPosition = (maxRow?.position ?? 0) + 1;

  const href = String(formData.get("href") ?? "").trim() || null;

  const { error } = await supabase.from("announcements").insert({
    category,
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    date: String(formData.get("date") ?? ""),
    image_id: String(formData.get("image_id") ?? ""),
    href,
    position: nextPosition,
  });

  if (error) return { error: error.message };

  revalidatePublicPages();
  redirect("/admin/announcements");
}

export async function updateAnnouncement(id: string, formData: FormData) {
  await requireRole(["admin", "super_admin"]);
  const supabase = createClient();

  const category = String(formData.get("category") ?? "");
  if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
    return { error: "Invalid category." };
  }

  const href = String(formData.get("href") ?? "").trim() || null;

  const { error } = await supabase
    .from("announcements")
    .update({
      category,
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      date: String(formData.get("date") ?? ""),
      image_id: String(formData.get("image_id") ?? ""),
      href,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePublicPages();
  return { success: true };
}

export async function deleteAnnouncement(id: string) {
  await requireRole(["admin", "super_admin"]);
  const supabase = createClient();
  await supabase.from("announcements").delete().eq("id", id);
  revalidatePublicPages();
}

export async function moveAnnouncement(id: string, direction: "up" | "down") {
  await requireRole(["admin", "super_admin"]);
  const supabase = createClient();

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
