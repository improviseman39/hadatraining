-- Helper functions for RLS policies that need to check the caller's own
-- role. A policy on `profiles` that subqueries `profiles` itself is
-- recursive (the subquery re-triggers profiles' own RLS). Wrapping the
-- check in a `security definer` function runs that one lookup with the
-- function owner's privileges, bypassing RLS just for it — the standard
-- Supabase-documented pattern for this exact situation.

create or replace function public.is_admin_or_super()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'super_admin')
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'super_admin'
  );
$$;

grant execute on function public.is_admin_or_super() to authenticated;
grant execute on function public.is_super_admin() to authenticated;
