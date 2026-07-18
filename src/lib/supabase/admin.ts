import "server-only"; // build fails if this is ever imported into a client bundle
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client — bypasses RLS entirely. Used ONLY for operations
 * unreachable through PostgREST/RLS: creating and deleting auth.users rows
 * via the Auth Admin API (inviteUserByEmail, deleteUser). Every other admin
 * mutation (sessions, content_blocks, announcements, role changes on
 * existing users) goes through the regular per-request client instead, so
 * RLS stays genuinely exercised by real traffic and this key's usage
 * surface stays as small as possible.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
