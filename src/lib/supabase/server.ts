import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Server-side Supabase client for Server Components, Route Handlers, and
 * Server Actions. Create a new instance per request — never share one
 * across requests.
 *
 * Server Components cannot write cookies (Next.js throws), so `setAll` is a
 * safe no-op there. The actual session refresh happens in `middleware.ts`,
 * which is the only place allowed to write the refreshed cookies back.
 *
 * `cookies()` is async as of Next.js 15+, so this must be awaited by every
 * caller.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — safe to ignore since
            // middleware.ts refreshes the session on every request.
          }
        },
      },
    }
  );
}
