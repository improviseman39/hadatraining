"use server";

import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPassword, hashToken } from "@/lib/classCredentials";

const DEVICE_COOKIE_NAME = "hada_seat";
const DEVICE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // ~1 year
const SEAT_EMAIL_DOMAIN = "members.hadatraining.internal";

/**
 * Signs the current request in as `email` via a one-time admin-issued magic
 * link, instead of a password — used for a returning device claiming its
 * existing seat, since a seat's real sign-in password is never stored
 * anywhere (see classLogin() below) and this is the standard Supabase
 * pattern for "the server vouches this specific account, no password
 * involved." generateLink() needs the service-role client; verifyOtp()
 * needs the per-request client so it can write the resulting session
 * cookies onto this response.
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
 * The temporary shared-credential access mode: one username/password per
 * cohort group, gating entry only — every browser that gets through it gets
 * its own ordinary auth.users "seat" behind the scenes (see the migration
 * comment in 0034_group_class_login.sql), so progress/bookings/2FA all work
 * exactly like any individually-invited account.
 *
 * Deliberately uses the service-role client (not the per-request one) for
 * every read/write here, including group_login_credentials/group_seats/
 * profiles — unlike the rest of the codebase's admin actions, which prefer
 * the per-request client so RLS stays exercised (see the comment in
 * src/lib/supabase/admin.ts). That convention assumes an authenticated
 * caller; this function's caller is, by definition, not yet authenticated
 * at all when it runs, so the per-request client couldn't read these
 * super_admin-only tables regardless. The service-role client is the only
 * option pre-authentication, same reasoning as inviteUserByEmail/createUser
 * elsewhere in the admin actions.
 */
export async function classLogin(formData: FormData) {
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!username || !password) {
    return { error: "Enter your class username and password." };
  }

  const admin = createAdminClient();

  const { data: credential } = await admin
    .from("group_login_credentials")
    .select("id, group_id, username, password_hash, seat_limit, active")
    .eq("username", username)
    .maybeSingle();

  // Same message either way — don't reveal whether the username or the
  // password was the wrong part.
  const genericError = { error: "That class username or password isn't right." };
  if (!credential || !credential.active) return genericError;
  if (!verifyPassword(password, credential.password_hash)) return genericError;

  const cookieStore = await cookies();
  const existingToken = cookieStore.get(DEVICE_COOKIE_NAME)?.value;

  if (existingToken) {
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
        const result = await establishSeatSession(authUser.user.email);
        if (result.error) return { error: result.error };
        await admin
          .from("group_seats")
          .update({ last_seen_at: new Date().toISOString() })
          .eq("id", seat.id);
        // Don't redirect here — the caller still needs to run the same
        // aal2 (TOTP) re-check LoginForm does after any sign-in. Returning
        // instead of redirecting lets ClassLoginForm perform that check
        // client-side with the fresh session this just established.
        return { success: true as const };
      }
    }
    // Cookie present but stale, revoked, or from a different cohort's
    // group — fall through and claim a fresh seat below, same as a
    // brand-new device.
  }

  const { count: liveSeatCount } = await admin
    .from("group_seats")
    .select("id", { count: "exact", head: true })
    .eq("group_id", credential.group_id)
    .is("revoked_at", null);

  if ((liveSeatCount ?? 0) >= credential.seat_limit) {
    return { error: "This class's access is full — ask your coordinator." };
  }

  // A one-time-use password for this account-creation call only — it's
  // never written anywhere. Every sign-in from here on (including the one
  // a few lines down) goes through signInWithPassword/establishSeatSession,
  // so there's no persisted seat password an attacker could ever target.
  const throwawayPassword = randomBytes(24).toString("base64url");
  const seatEmail = `seat-${randomBytes(12).toString("hex")}@${SEAT_EMAIL_DOMAIN}`;

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: seatEmail,
    password: throwawayPassword,
    // Must be true — see the identical comment in admin/users/actions.ts:
    // GoTrue hard-blocks sign-in for unconfirmed accounts regardless of
    // config.
    email_confirm: true,
    user_metadata: { role: "user" },
  });
  if (createError || !created?.user) {
    return { error: createError?.message ?? "Couldn't set up your access. Try again." };
  }

  // Skip the parts of onboarding that don't apply to a synthetic seat
  // identity — there's no real inbox behind seatEmail to verify, and no one
  // ever sees (let alone needs to change) the throwaway password above.
  // mfa_enrolled is deliberately left alone: the existing onboarding
  // middleware (src/lib/supabase/middleware.ts) already routes any account
  // without a verified factor straight to /onboarding/setup-2fa on its own,
  // so a seat goes through exactly the same 2FA enrollment as any other
  // account without this code needing to know that path itself.
  await admin
    .from("profiles")
    .update({
      must_change_password: false,
      email_verified_at: new Date().toISOString(),
      group_id: credential.group_id,
    })
    .eq("id", created.user.id);

  const deviceToken = randomBytes(32).toString("hex");
  await admin.from("group_seats").insert({
    group_id: credential.group_id,
    user_id: created.user.id,
    device_token_hash: hashToken(deviceToken),
  });

  cookieStore.set(DEVICE_COOKIE_NAME, deviceToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: DEVICE_COOKIE_MAX_AGE_SECONDS,
    path: "/",
  });

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: seatEmail,
    password: throwawayPassword,
  });
  if (signInError) {
    return { error: "Access was set up, but couldn't sign you in automatically. Try again." };
  }

  // A brand-new seat has no MFA factor enrolled yet, so the aal2 check
  // ClassLoginForm runs next is a no-op — the existing onboarding
  // middleware (src/lib/supabase/middleware.ts) routes it to
  // /onboarding/setup-2fa on the very next request regardless.
  return { success: true as const };
}
