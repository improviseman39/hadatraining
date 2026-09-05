"use server";

import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPassword, hashToken } from "@/lib/classCredentials";

const DEVICE_COOKIE_NAME = "hada_seat";
const DEVICE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // ~1 year
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Explicit result types rather than relying on inference across many
// return statements — a "use server" file's exports are Server Actions,
// and TypeScript's inferred union across scattered object-literal returns
// isn't always as precise a discriminated union as it looks (callers like
// LoginForm.tsx narrowing on `"error" in result` need this to be exact).
type LoginResult = { error: string } | { needsProfile: true } | { success: true };
type ClaimSeatResult = { error: string } | { success: true };

type GroupCredential = {
  id: string;
  group_id: string;
  username: string;
  password_hash: string;
  seat_limit: number;
  active: boolean;
};

/**
 * Looks up a cohort's shared credential by username only — no password
 * check yet. This is what login() uses to decide, in the background,
 * whether what was typed into the single identifier field is a class
 * username or an individual email address: if a row comes back, it's a
 * class login attempt; if not, fall through to a normal email/password
 * sign-in. Deliberately uses the service-role client, not the per-request
 * one: this runs before the caller is authenticated at all (a plain user
 * request couldn't read this super_admin-only table via RLS regardless).
 */
async function findGroupCredential(identifier: string): Promise<GroupCredential | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("group_login_credentials")
    .select("id, group_id, username, password_hash, seat_limit, active")
    .eq("username", identifier.trim().toLowerCase())
    .maybeSingle();
  return data;
}

/**
 * Signs the current request in as `email` via a one-time admin-issued magic
 * link, instead of a password — used for a returning device claiming its
 * existing seat, since a seat's real password is chosen by the person
 * themselves during onboarding (see claimSeat() below) and this code never
 * sees or stores it. generateLink() needs the service-role client;
 * verifyOtp() needs the per-request client so it can write the resulting
 * session cookies onto this response.
 */
async function establishSeatSession(email: string): Promise<{ error?: string }> {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (error || !data) return { error: error?.message ?? "Couldn't sign you in. Try again." };

  const supabase = await createClient();
  const { error: verifyError } = await supabase.auth.verifyOtp({
    token_hash: data.properties.hashed_token,
    type: "magiclink",
  });
  if (verifyError) return { error: verifyError.message };
  return {};
}

/**
 * The temporary shared-credential access mode, once login() has already
 * decided this is a class login attempt with a verified password. A
 * returning device (recognized by its device-token cookie) signs straight
 * back into its existing seat here; a brand-new device gets told to
 * collect a name/email first (LoginForm then calls claimSeat() with those)
 * rather than this silently provisioning an anonymous account.
 */
async function classLoginFlow(credential: GroupCredential): Promise<LoginResult> {
  const cookieStore = await cookies();
  const existingToken = cookieStore.get(DEVICE_COOKIE_NAME)?.value;

  if (existingToken) {
    const admin = createAdminClient();
    const { data: seat } = await admin
      .from("group_seats")
      .select("id, user_id")
      .eq("group_id", credential.group_id)
      .eq("device_token_hash", hashToken(existingToken))
      .is("revoked_at", null)
      .maybeSingle();

    if (seat) {
      const { data: authUser } = await admin.auth.admin.getUserById(seat.user_id);
      if (authUser?.user?.email) {
        const signInResult = await establishSeatSession(authUser.user.email);
        if (signInResult.error) return { error: signInResult.error };
        await admin
          .from("group_seats")
          .update({ last_seen_at: new Date().toISOString() })
          .eq("id", seat.id);
        // Don't redirect here — the caller still needs to run the same
        // aal2 (TOTP) re-check LoginForm does after any sign-in.
        return { success: true };
      }
    }
    // Cookie present but stale, revoked, or from a different cohort's
    // group — fall through and treat this as a brand-new device.
  }

  return { needsProfile: true };
}

/**
 * The one login entry point for both individual accounts and shared class
 * credentials — LoginForm no longer asks which kind of login this is; this
 * decides in the background. If `identifier` matches a cohort's class
 * username, it's routed through the shared-credential flow; otherwise it's
 * treated as an ordinary email and signed in the normal way.
 */
export async function login(formData: FormData): Promise<LoginResult> {
  const identifier = String(formData.get("identifier") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!identifier || !password) {
    return { error: "Enter your email or class username, and password." };
  }

  const groupCredential = await findGroupCredential(identifier);
  if (groupCredential) {
    // Same message either way — don't reveal whether the username or the
    // password was the wrong part.
    if (!groupCredential.active || !verifyPassword(password, groupCredential.password_hash)) {
      return { error: "That class username or password isn't right." };
    }
    return classLoginFlow(groupCredential);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: identifier, password });
  if (error) return { error: error.message };
  return { success: true };
}

/**
 * Completes a brand-new device's first login: collects a real name and
 * email instead of provisioning an anonymous seat, so there's at least an
 * auditable record of who's using each of a cohort's slots (there's no
 * attendee roster to check against — this doesn't prove class attendance,
 * it just replaces total anonymity with a named, email-verified account).
 * Re-verifies the shared credential itself rather than trusting that the
 * caller already went through login() in this same session.
 */
export async function claimSeat(formData: FormData): Promise<ClaimSeatResult> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!fullName) return { error: "Enter your full name." };
  if (!EMAIL_RE.test(email)) return { error: "Enter a valid email address." };

  const credential = await findGroupCredential(username);
  if (!credential || !credential.active || !verifyPassword(password, credential.password_hash)) {
    return { error: "That class username or password isn't right." };
  }

  const admin = createAdminClient();

  const { count: liveSeatCount } = await admin
    .from("group_seats")
    .select("id", { count: "exact", head: true })
    .eq("group_id", credential.group_id)
    .is("revoked_at", null);

  if ((liveSeatCount ?? 0) >= credential.seat_limit) {
    return { error: "This class's access is full — ask your coordinator." };
  }

  // A one-time-use password for this creation call only — the person sets
  // their own real password a moment from now, via the existing
  // /onboarding/set-password step (must_change_password defaults true on a
  // new profile row, same as any admin-created account), so this value is
  // never seen or reused after the signInWithPassword call below.
  const throwawayPassword = randomBytes(24).toString("base64url");

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: throwawayPassword,
    // Must be true — see the identical comment in admin/users/actions.ts:
    // GoTrue hard-blocks sign-in for unconfirmed accounts regardless of
    // config. Real proof of owning this inbox is still enforced by the
    // existing email_verified_at / OTP onboarding step right after this,
    // which is deliberately left to run (unlike the old synthetic-email
    // version of this flow) since the email is now a real one worth
    // verifying.
    email_confirm: true,
    user_metadata: { role: "user", full_name: fullName },
  });
  if (createError || !created?.user) {
    if (/already been registered|already exists/i.test(createError?.message ?? "")) {
      return {
        error: "That email already has an account — log in normally instead of using the class code.",
      };
    }
    return { error: createError?.message ?? "Couldn't set up your access. Try again." };
  }

  // Only group_id needs setting explicitly — full_name came through
  // user_metadata and is already populated by the handle_new_user()
  // trigger (0020_self_signup_profile_fields.sql), and
  // must_change_password/email_verified_at are left at their normal
  // defaults so this account goes through the same onboarding chain
  // (verify email, then set password, then set up 2FA) as any other.
  await admin.from("profiles").update({ group_id: credential.group_id }).eq("id", created.user.id);

  const deviceToken = randomBytes(32).toString("hex");
  await admin.from("group_seats").insert({
    group_id: credential.group_id,
    user_id: created.user.id,
    device_token_hash: hashToken(deviceToken),
  });

  const cookieStore = await cookies();
  cookieStore.set(DEVICE_COOKIE_NAME, deviceToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: DEVICE_COOKIE_MAX_AGE_SECONDS,
    path: "/",
  });

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: throwawayPassword,
  });
  if (signInError) {
    return { error: "Access was set up, but couldn't sign you in automatically. Try again." };
  }

  // The existing onboarding middleware (src/lib/supabase/middleware.ts)
  // takes it from here — email isn't verified yet, so the very next
  // request lands on /onboarding/verify-email, then set-password, then
  // setup-2fa, exactly like any other new account.
  return { success: true };
}
