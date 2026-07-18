-- Live/in-person training appointment bookings — distinct from
-- public.sessions (curriculum lesson CONTENT). Admin/super_admin records
-- a booking that was already confirmed/paid outside the app; no
-- availability/conflict checking by design — don't add a uniqueness or
-- exclusion constraint here to "prevent double-booking" without a
-- deliberate product decision to build that engine.

create table public.bookings (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  session_id    uuid references public.sessions(id) on delete set null,
  start_at      timestamptz not null,
  end_at        timestamptz not null,
  notes         text,
  sequence      integer not null default 0,
  created_by    uuid references public.profiles(id) on delete set null,
  updated_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint bookings_end_after_start check (end_at > start_at)
);

create index bookings_user_id_start_at_idx on public.bookings (user_id, start_at);
create index bookings_session_id_idx on public.bookings (session_id);

comment on column public.bookings.session_id is
  'FK to the curriculum session this appointment is about. Nullable only so ON DELETE SET NULL can fire if that session is later deleted; always required at insert time by the Server Action, not a DB constraint.';
comment on column public.bookings.sequence is
  'RFC 5545 SEQUENCE for the generated ICS. Incremented on every update so a re-download reflects the edit in the user''s calendar app instead of looking like an unrelated duplicate.';

create trigger bookings_set_updated_at
  before update on public.bookings
  for each row execute function public.set_updated_at();

alter table public.bookings enable row level security;

-- A member reads only their own bookings.
grant select on public.bookings to authenticated;
create policy "bookings_select_own"
  on public.bookings
  for select
  to authenticated
  using (user_id = auth.uid());

-- admin/super_admin can read AND write every booking.
grant insert, update, delete on public.bookings to authenticated;
create policy "bookings_admin_all"
  on public.bookings
  for all
  using (public.is_admin_or_super())
  with check (public.is_admin_or_super());

-- No anon grant/policy at all: unlike sessions/content_blocks/announcements,
-- this data is private — there is no public-read case for a booking.

-- Narrow RPC so 'admin' (not just 'super_admin') can populate the "which
-- user" dropdown when creating a booking. 0008_profiles_admin_policies.sql
-- deliberately gives admin zero general read access to other users'
-- profiles ("admin gets zero user-management surface") — this function
-- does NOT reverse that. It exposes only id+email, nothing else (no role,
-- no invited_by), gated by the same admin check, for this one narrow use.
create or replace function public.list_profiles_for_booking()
returns table (id uuid, email text)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_admin_or_super() then
    raise exception 'not authorized';
  end if;
  return query select p.id, p.email from public.profiles p order by p.email;
end;
$$;

grant execute on function public.list_profiles_for_booking() to authenticated;
