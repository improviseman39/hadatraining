"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";

function revalidatePublicPages() {
  revalidatePath("/qa");
  revalidatePath("/admin/qa");
}

export async function createQaEntry(formData: FormData) {
  await requireRole(["admin", "super_admin"]);
  const supabase = await createClient();

  const question = String(formData.get("question") ?? "").trim();
  const answer = String(formData.get("answer") ?? "").trim();
  if (!question || !answer) return { error: "Both a question and an answer are required." };

  const { data: existing } = await supabase
    .from("qa_entries")
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextPosition = (existing?.position ?? 0) + 1;

  const { error } = await supabase
    .from("qa_entries")
    .insert({ question, answer, position: nextPosition });

  if (error) return { error: error.message };

  revalidatePublicPages();
  redirect("/admin/qa");
}

export async function updateQaEntry(id: string, formData: FormData) {
  await requireRole(["admin", "super_admin"]);
  const supabase = await createClient();

  const question = String(formData.get("question") ?? "").trim();
  const answer = String(formData.get("answer") ?? "").trim();
  if (!question || !answer) return { error: "Both a question and an answer are required." };

  const { error } = await supabase
    .from("qa_entries")
    .update({ question, answer })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePublicPages();
  return { success: true };
}

export async function deleteQaEntry(id: string) {
  await requireRole(["admin", "super_admin"]);
  const supabase = await createClient();
  await supabase.from("qa_entries").delete().eq("id", id);
  revalidatePublicPages();
}

export async function moveQaEntry(id: string, direction: "up" | "down") {
  await requireRole(["admin", "super_admin"]);
  const supabase = await createClient();

  const { data: current } = await supabase
    .from("qa_entries")
    .select("position")
    .eq("id", id)
    .single();
  if (!current) return;

  const query = supabase.from("qa_entries").select("id, position");
  const { data: target } = await (
    direction === "up"
      ? query.lt("position", current.position).order("position", { ascending: false })
      : query.gt("position", current.position).order("position", { ascending: true })
  )
    .limit(1)
    .single();

  if (!target) return;

  await supabase.from("qa_entries").update({ position: target.position }).eq("id", id);
  await supabase.from("qa_entries").update({ position: current.position }).eq("id", target.id);

  revalidatePublicPages();
}
