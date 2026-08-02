import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

// Singleton: every previous call site created a brand-new GoTrueClient,
// and multiple concurrent clients on the same origin serialize their auth
// operations behind the same navigator.locks name — one call's lock could
// starve every other call's auth request indefinitely (looked like the
// UI just "freezing" with no error and no network request ever firing).
let client: SupabaseClient | undefined;

export function createClient() {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return client;
}
