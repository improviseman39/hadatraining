-- Temporary access model: one shared username/password per cohort group
-- (e.g. "HADA class 2023"), handed out to a whole class instead of
-- collecting individual emails. The shared credential only ever gates the
-- front door — every browser that passes it gets its OWN ordinary
-- auth.users row behind the scenes (a "seat"), remembered by a device-token
-- cookie, so progress/bookings/2FA all keep working exactly like any other
-- individual account. seat_limit is what actually caps a cohort at ~200:
-- once that many distinct devices have ever claimed a seat, the next new
-- device is turned away. See src/lib/actions/classLogin.ts.
--
-- Both tables are only ever touched via the service-role client
-- (src/lib/supabase/admin.ts) from classLogin.ts and the admin actions in
-- src/app/admin/users/actions.ts — never from a client-side/anon request —
-- so RLS below is a super-admin-only backstop, same trust boundary as
-- public.groups itself (0025_user_groups.sql).

create table public.group_login_credentials (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null unique references public.groups(id) on delete cascade,
  username    text not null unique,
  password_hash text not null,
  seat_limit  int not null default 200 check (seat_limit > 0),
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid references public.profiles(id) on delete set null
);

comment on table public.group_login_credentials is
  'One shared username/password per cohort group, for the temporary class-login access mode. password_hash is scrypt (see hashPassword in classLogin.ts) — this table is only ever read/written via the service-role client, never exposed through PostgREST to anon.';

create trigger group_login_credentials_set_updated_at
  before update on public.group_login_credentials
  for each row execute function public.set_updated_at();

alter table public.group_login_credentials enable row level security;

create policy "group_login_credentials_all_super_admin"
  on public.group_login_credentials
  for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

grant select, insert, update, delete on public.group_login_credentials to authenticated;

create table public.group_seats (
  id                uuid primary key default gen_random_uuid(),
  group_id          uuid not null references public.groups(id) on delete cascade,
  user_id           uuid not null unique references auth.users(id) on delete cascade,
  device_token_hash text not null unique,
  claimed_at        timestamptz not null default now(),
  last_seen_at      timestamptz not null default now(),
  revoked_at        timestamptz
);

comment on table public.group_seats is
  'One row per device that has claimed a seat under a cohort''s shared class-login credential. device_token_hash is sha256 of the raw device-token cookie value (the raw value never touches the database). A seat''s live/revoked state is what the 200-per-cohort cap actually counts.';
comment on column public.group_seats.revoked_at is
  'Set by an admin (e.g. lost device, person left) to free the seat — the device''s cookie stops working and the slot becomes available to a new device.';

create index group_seats_live_idx on public.group_seats (group_id) where revoked_at is null;

alter table public.group_seats enable row level security;

create policy "group_seats_all_super_admin"
  on public.group_seats
  for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

grant select, insert, update, delete on public.group_seats to authenticated;

-- Lets /signup hide itself (while keeping its code fully intact) while this
-- temporary access mode is in effect. Defaults true so nothing changes
-- until a super_admin explicitly turns it off.
alter table public.site_settings
  add column public_signup_enabled boolean not null default true;

comment on column public.site_settings.public_signup_enabled is
  'When false, /signup shows a closed notice instead of the registration form (the form/route/action are untouched). Toggle from /admin/users. Unrelated to the "design" role''s site_settings_design_write policy scope in spirit, but that policy is already whole-row — enforcement that only super_admin flips this lives in the setPublicSignupEnabled server action itself (requireRole(["super_admin"])), same defense-in-depth pattern already used elsewhere in this codebase.';
