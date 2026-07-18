"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ROLES = ["user", "admin", "super_admin"] as const;
type RoleValue = (typeof ROLES)[number];

// Matches [auth] minimum_password_length in supabase/config.toml.
const MIN_PASSWORD_LENGTH = 6;

function generatePassword(length = 16) {
  return randomBytes(length).toString("base64url").slice(0, length);
}

export async function inviteUser(formData: FormData) {
  const { user: caller } = await requireRole(["super_admin"]);

  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "user");
  if (!email) return { error: "Email is required." };
  if (!ROLES.includes(role as RoleValue)) return { error: "Invalid role." };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { role, invited_by: caller.id },
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/users");
  return { success: true };
}

export async function createUserDirect(formData: FormData) {
  const { user: caller } = await requireRole(["super_admin"]);

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "user");
  if (!email) return { error: "Email is required." };
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
  }
  if (!ROLES.includes(role as RoleValue)) return { error: "Invalid role." };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role, invited_by: caller.id },
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/users");
  return { success: true };
}

export async function resetPassword(userId: string) {
  await requireRole(["super_admin"]);

  const password = generatePassword();
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, { password });

  if (error) return { error: error.message };

  return { success: true, password };
}

async function superAdminCount(excluding?: string) {
  const supabase = createClient();
  const query = supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "super_admin");
  const { count } = excluding ? await query.neq("id", excluding) : await query;
  return count ?? 0;
}

export async function changeRole(userId: string, formData: FormData) {
  const { user: caller } = await requireRole(["super_admin"]);

  const role = String(formData.get("role") ?? "");
  if (!ROLES.includes(role as RoleValue)) return { error: "Invalid role." };

  if (userId === caller.id && role !== "super_admin") {
    return { error: "You can't change your own role away from super_admin." };
  }

  const supabase = createClient();
  const { data: target } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (target?.role === "super_admin" && role !== "super_admin") {
    const remaining = await superAdminCount(userId);
    if (remaining === 0) {
      return { error: "Can't demote the last remaining super_admin." };
    }
  }

  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) return { error: error.message };

  revalidatePath("/admin/users");
  return { success: true };
}

export async function removeUser(userId: string) {
  const { user: caller } = await requireRole(["super_admin"]);

  if (userId === caller.id) {
    return { error: "You can't remove your own account." };
  }

  const supabase = createClient();
  const { data: target } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (target?.role === "super_admin") {
    const remaining = await superAdminCount(userId);
    if (remaining === 0) {
      return { error: "Can't remove the last remaining super_admin." };
    }
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { error: error.message };

  revalidatePath("/admin/users");
  return { success: true };
}
