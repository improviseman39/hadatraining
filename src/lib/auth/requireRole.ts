import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/context/AuthContext";

/**
 * Server-side role gate. Redirects (not just hides) unauthorized requests.
 * Called by admin layouts to guard page rendering, AND independently by
 * every Server Action under src/app/admin/**\/actions.ts — a layout guard
 * only protects rendering, not the action, which is reachable on its own.
 */
export async function requireRole(allowed: Role[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !allowed.includes(profile.role as Role)) {
    redirect("/");
  }

  return { user, role: profile.role as Role };
}
