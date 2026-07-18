-- Super Admins can see and edit any profile (including changing role).
-- Postgres OR's multiple permissive policies together, so these ADD to
-- 0001's profiles_select_own / profiles_update_own_non_role_fields rather
-- than replacing them.
--
-- Deliberately no policy here for 'admin' — per explicit product
-- requirement, admin gets zero user-management surface, not even read
-- access to the user list. No new GRANT needed: 0001's
-- `GRANT SELECT, UPDATE ON profiles TO authenticated` already covers the
-- ceiling; RLS narrows further per-role.
--
-- No profiles DELETE policy: user removal goes through the Auth Admin API
-- (service_role, server-only — see src/lib/supabase/admin.ts), which
-- deletes the auth.users row directly and cascades to profiles via the
-- existing ON DELETE CASCADE FK. RLS is never in that path.

create policy "profiles_select_all_super_admin"
  on public.profiles
  for select
  using (public.is_super_admin());

create policy "profiles_update_any_super_admin"
  on public.profiles
  for update
  using (public.is_super_admin())
  with check (public.is_super_admin());
