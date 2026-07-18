import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ONBOARDING_EXEMPT_PREFIXES = ["/onboarding", "/login", "/forgot-password", "/reset-password", "/api", "/auth"];

function isOnboardingExempt(pathname: string): boolean {
  return ONBOARDING_EXEMPT_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

type OnboardingStatus = {
  onboarding_exempt: boolean;
  must_change_password: boolean;
  email_verified: boolean;
  mfa_enrolled: boolean;
};

/** Mirrors get_onboarding_status() in 0019_onboarding_and_mfa.sql — first incomplete step wins. */
function resolveOnboardingStep(status: OnboardingStatus): string | null {
  if (status.onboarding_exempt) return null;
  if (!status.email_verified) return "/onboarding/verify-email";
  if (status.must_change_password) return "/onboarding/set-password";
  if (!status.mfa_enrolled) return "/onboarding/setup-2fa";
  return null;
}

/**
 * Refreshes the Supabase session on every request. Runs in middleware.ts.
 * Uses getUser() (not getSession()) so the token is revalidated against
 * the Auth server rather than trusted from an unverified cookie. Also
 * enforces the mandatory first-login chain (verify email, set a real
 * password, enroll 2FA) — this is the one place a check already runs on
 * every request, so it's the only place that's a real security boundary
 * rather than a client-side-only redirect.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // No Supabase project connected yet (.env.local not filled in) — skip
  // the refresh instead of crashing every request. Once real credentials
  // are set this branch never runs.
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && !isOnboardingExempt(request.nextUrl.pathname)) {
    const { data: status } = await supabase
      .rpc("get_onboarding_status")
      .single<OnboardingStatus>();
    const nextStep = status ? resolveOnboardingStep(status) : null;

    if (nextStep) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = nextStep;
      const redirectResponse = NextResponse.redirect(redirectUrl);
      response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
      return redirectResponse;
    }
  }

  return response;
}
