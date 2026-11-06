"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkVerificationCode, issueVerificationCode } from "@/lib/otp";

const MIN_PASSWORD_LENGTH = 8;

type SignUpResult =
  | { error: string; alreadyExists?: true; needsCode?: true }
  | { needsCode: true; notice: string };

/**
 * An account someone started registering but never finished: still no
 * verified email, never onboarded, an ordinary member (not an invited
 * admin or a class seat). Registering again with the same email resumes
 * this account instead of dead-ending on "already exists" — but only after
 * the person proves they own the email (see signUp).
 */
async function findUnfinishedRegistration(
  admin: ReturnType<typeof createAdminClient>,
  email: string
): Promise<{ id: string; email: string } | null> {
  const { data: profile } = await admin
    .from("profiles")
    .select("id, email_verified_at, onboarding_exempt, role, group_id")
    .eq("email", email)
    .maybeSingle();
  if (
    !profile ||
    profile.email_verified_at ||
    profile.onboarding_exempt ||
    profile.role !== "user" ||
    profile.group_id
  ) {
    return null;
  }

  // Confirm against the auth record itself so a profile row can never be
  // matched to somebody else's login by accident.
  const { data: authUser } = await admin.auth.admin.getUserById(profile.id);
  if (authUser?.user?.email?.toLowerCase() !== email) return null;
  return { id: profile.id, email };
}

export async function signUp(formData: FormData): Promise<SignUpResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const isClinicOwner = formData.get("is_clinic_owner") === "on";
  const clinicName = isClinicOwner ? String(formData.get("clinic_name") ?? "").trim() : "";
  const position = String(formData.get("position") ?? "");
  const province = String(formData.get("province") ?? "");
  const classYear = String(formData.get("class_year") ?? "");
  const privacyAccepted = formData.get("privacy_accepted") === "true";
  const privacyPolicyVersion = String(formData.get("privacy_policy_version") ?? "");
  // Only present when resuming an unfinished registration (see below).
  const code = String(formData.get("code") ?? "").trim();

  if (!email) return { error: "Email is required." };
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
  }
  if (!fullName) return { error: "Full name is required." };
  if (isClinicOwner && !clinicName) return { error: "Clinic name is required for clinic owners." };
  if (!privacyAccepted) return { error: "Please agree to the Privacy Policy to continue." };

  const admin = createAdminClient();

  // The /signup page hides the form when registration is closed, but a
  // Server Action can be called directly — so the switch is enforced here
  // too. Fails open when the row is missing, same as the page.
  const { data: settings } = await admin
    .from("site_settings")
    .select("public_signup_enabled")
    .eq("id", true)
    .single();
  if (!(settings?.public_signup_enabled ?? true)) {
    return { error: "Self-registration isn't open right now." };
  }

  const memberFields = {
    full_name: fullName,
    phone: phone || null,
    is_clinic_owner: isClinicOwner,
    clinic_name: clinicName || null,
    position: position || null,
    province: province || null,
    class_year: classYear || null,
  };

  // Set when this call is finishing an earlier, abandoned registration
  // rather than creating a new account.
  let resumedProfileUpdate: Record<string, unknown> | null = null;

  if (code) {
    if (!/^\d{6}$/.test(code)) return { error: "Enter the 6-digit code.", needsCode: true };

    const unfinished = await findUnfinishedRegistration(admin, email);
    if (!unfinished) {
      return { error: "That registration can't be resumed. Please try logging in instead." };
    }

    const check = await checkVerificationCode(unfinished.id, code);
    if ("error" in check) {
      // An expired code shouldn't be a dead end — send the next one for them.
      if (check.expired) {
        const resent = await issueVerificationCode(unfinished.id, unfinished.email);
        if (!resent.error) {
          return {
            error:
              "That code had expired, so we've just emailed you a new one. Check your inbox (and spam folder) and enter the new code.",
            needsCode: true,
          };
        }
      }
      return { error: check.error, needsCode: true };
    }

    // They've just proven they own this email, so this replaces the first
    // attempt's password with the one they typed now and counts as verified.
    const { error: updateError } = await admin.auth.admin.updateUserById(unfinished.id, {
      password,
      user_metadata: { role: "user", ...memberFields },
    });
    if (updateError) return { error: updateError.message };

    resumedProfileUpdate = { ...memberFields, email_verified_at: new Date().toISOString() };
  } else {
    const { error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      // Must be true — see the identical comment in admin/users/actions.ts:
      // GoTrue hard-blocks sign-in for unconfirmed accounts regardless of
      // config. Real proof-of-ownership is our own OTP step right after this.
      email_confirm: true,
      user_metadata: { role: "user", ...memberFields },
    });

    if (createError) {
      if (/already been registered|already exists/i.test(createError.message)) {
        // Someone who left partway through (typically at the emailed code,
        // which then expired) and is registering again. Their account is
        // real but unfinished and they can't sign in with this new
        // password — so instead of dead-ending, prove the email is theirs
        // with a fresh code and let them pick up where they left off.
        const unfinished = await findUnfinishedRegistration(admin, email);
        if (unfinished) {
          const sent = await issueVerificationCode(unfinished.id, unfinished.email);
          if (sent.error) return { error: sent.error };
          return {
            needsCode: true,
            notice:
              "You started registering with this email before but didn't finish. We've emailed you a new 6-digit code — enter it below to finish. (Check your spam folder too.)",
          };
        }
        return {
          error: "An account with that email already exists.",
          alreadyExists: true,
        };
      }
      return { error: createError.message };
    }
  }

  // They just chose this password themselves — no separate "change it"
  // onboarding step needed, unlike admin-created accounts with a temporary
  // one. Still need to sign them in: creating the account server-side via
  // the admin API doesn't establish a session for their own browser.
  const supabase = await createClient();
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError || !signInData.user) {
    return { error: "Account created, but couldn't log you in automatically. Try logging in." };
  }

  await admin
    .from("profiles")
    .update({ must_change_password: false, ...resumedProfileUpdate })
    .eq("id", signInData.user.id);

  // Separate call, deliberately: these columns are from a later migration
  // (0035_privacy_consent.sql). If that migration isn't applied yet in some
  // environment, this failing must never take must_change_password with it.
  await admin
    .from("profiles")
    .update({
      privacy_accepted_at: new Date().toISOString(),
      privacy_policy_version: privacyPolicyVersion || null,
    })
    .eq("id", signInData.user.id);

  redirect("/");
}
