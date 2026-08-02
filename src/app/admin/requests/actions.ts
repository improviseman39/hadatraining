"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";

export async function markRequestResolved(id: string) {
  await requireRole(["admin", "super_admin"]);
  const supabase = createClient();
  await supabase.from("requests").update({ status: "resolved" }).eq("id", id);
  revalidatePath("/admin/requests");
}

export async function markRequestNew(id: string) {
  await requireRole(["admin", "super_admin"]);
  const supabase = createClient();
  await supabase.from("requests").update({ status: "new" }).eq("id", id);
  revalidatePath("/admin/requests");
}

export async function deleteRequest(id: string) {
  await requireRole(["admin", "super_admin"]);
  const supabase = createClient();
  await supabase.from("requests").delete().eq("id", id);
  revalidatePath("/admin/requests");
}
