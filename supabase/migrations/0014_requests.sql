-- Free-text requests submitted by any logged-in member via the site-wide
-- request widget. Admin/super_admin triage them from /admin/requests.
-- Deliberately two statuses only ("new"/"resolved") — no assignment,
-- priority, or reply thread until a real product need for those emerges.

create table public.requests (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  message     text not null,
  status      text not null default 'new' check (status in ('new', 'resolved')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index requests_user_id_created_at_idx on public.requests (user_id, created_at desc);
create index requests_status_created_at_idx on public.requests (status, created_at desc);

create trigger requests_set_updated_at
  before update on public.requests
  for each row execute function public.set_updated_at();

alter table public.requests enable row level security;

-- A member reads only their own requests.
grant select on public.requests to authenticated;
create policy "requests_select_own"
  on public.requests
  for select
  to authenticated
  using (user_id = auth.uid());

-- A member can submit a request for themselves only.
grant insert on public.requests to authenticated;
create policy "requests_insert_own"
  on public.requests
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- admin/super_admin can read, update (status), and delete every request.
grant select, update, delete on public.requests to authenticated;
create policy "requests_admin_all"
  on public.requests
  for all
  using (public.is_admin_or_super())
  with check (public.is_admin_or_super());

-- No anon grant/policy: private, same reasoning as bookings.

-- Submitter identity for the admin list is resolved via the existing
-- public.list_profiles_for_booking() RPC (0013_bookings.sql) — reused as-is,
-- no new RPC needed, keeping the "admin gets zero general profile read
-- access" boundary from 0008_profiles_admin_policies.sql intact.
