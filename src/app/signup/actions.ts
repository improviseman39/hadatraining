"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const MIN_PASSWORD_LENGTH = 6;

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const isClinicOwner = formData.get("is_clinic_owner") === "on";
  const clinicName = isClinicOwner ? String(formData.get("clinic_name") ?? "").trim() : "";
  const position = String(formData.get("position") ?? "");
  const province = String(formData.get("province") ?? "");
  const classYear = String(formData.get("class_year") ?? "");

  if (!email) return { error: "Email is required." };
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
  }
  if (!fullName) return { error: "Full name is required." };
  if (isClinicOwner && !clinicName) return { error: "Clinic name is required for clinic owners." };

  const admin = createAdminClient();
  const { error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    // Must be true — see the identical comment in admin/users/actions.ts:
    // GoTrue hard-blocks sign-in for unconfirmed accounts regardless of
    // config. Real proof-of-ownership is our own OTP step right after this.
    email_confirm: true,
    user_metadata: {
      role: "user",
      full_name: fullName,
      phone: phone || null,
      is_clinic_owner: isClinicOwner,
      clinic_name: clinicName || null,
      position: position || null,
      province: province || null,
      class_year: classYear || null,
    },
  });

  if (createError) {
    if (/already been registered|already exists/i.test(createError.message)) {
      return { error: "An account with that email already exists. Try logging in instead." };
    }
    return { error: createError.message };
  }

  // They just chose this password themselves — no separate "change it"
  // onboarding step needed, unlike admin-created accounts with a temporary
  // one. Still need to sign them in: creating the account server-side via
  // the admin API doesn't establish a session for their own browser.
  const supabase = createClient();
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError || !signInData.user) {
    return { error: "Account created, but couldn't log you in automatically. Try logging in." };
  }

  await supabase
    .from("profiles")
    .update({ must_change_password: false })
    .eq("id", signInData.user.id);

  redirect("/");
}
