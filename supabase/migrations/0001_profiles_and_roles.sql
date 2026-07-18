-- Phase 1: profiles table + role, auto-provisioning trigger, Row Level Security.
-- Runnable as-is in DBeaver's SQL editor or the Supabase SQL editor.

-- 1. profiles table -----------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  role        text not null default 'user'
                check (role in ('super_admin', 'admin', 'user')),
  invited_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is
  'One row per auth.users row. Holds the 3-tier RBAC role. Row is created automatically by handle_new_user() whenever a new auth.users row appears.';
comment on column public.profiles.role is
  'One of: super_admin, admin, user (descending privilege).';
comment on column public.profiles.invited_by is
  'profiles.id of the admin who created this account. Null for the manually-bootstrapped first super_admin.';

-- keep updated_at current on any UPDATE
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- 2. auto-create profile row when a new auth.users row appears ----------
-- Fires for both dashboard-created users and (Phase 3) Admin API
-- inviteUserByEmail/createUser calls, since both insert into auth.users.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, role, invited_by)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'role', 'user'),
    nullif(new.raw_user_meta_data ->> 'invited_by', '')::uuid
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- 3. Row Level Security ---------------------------------------------------
alter table public.profiles enable row level security;

-- RLS policies restrict which ROWS are visible/writable — they don't grant
-- baseline table access. Postgres denies SELECT/UPDATE outright without
-- these GRANTs, regardless of any policy below. No INSERT/DELETE grant:
-- profile rows are only ever created by the trigger (security definer,
-- bypasses RLS) and only ever removed via auth.users cascade.
grant select, update on public.profiles to authenticated;

-- Every authenticated user can read their own profile row (needed by the
-- client to know its own role for content-gating).
create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

-- Users may update their own profile, but NEVER their own role or
-- invited_by — those are Phase 3 admin-only fields.
create policy "profiles_update_own_non_role_fields"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = (select p.role from public.profiles p where p.id = auth.uid())
  );

-- No insert/delete policies for 'authenticated' — profile rows are only
-- ever created by the handle_new_user() trigger (which runs as
-- security definer and bypasses RLS) and only ever deleted via
-- auth.users cascade. No client-side code path can create or delete a
-- profile row directly.
