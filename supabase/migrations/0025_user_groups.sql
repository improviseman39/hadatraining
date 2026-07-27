-- Cohort/class groupings (e.g. "HADA class 2026 July") so an admin can
-- bulk-assign a booking to everyone in a group in one click, instead of
-- adding each person to the timetable individually. A user belongs to at
-- most one group at a time (group_id lives on profiles, not a join table)
-- — simpler to build and to use, and matches how a class/cohort actually
-- works here.
create table public.groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid references public.profiles(id) on delete set null
);

create trigger groups_set_updated_at
  before update on public.groups
  for each row execute function public.set_updated_at();

alter table public.groups enable row level security;

-- Managing groups (creating them, assigning members) is user management —
-- per the existing "admin gets zero user-management surface" decision
-- (0008_profiles_admin_policies.sql), that stays super_admin-only here.
-- 'admin' only ever sees groups through the narrow booking RPC below.
create policy "groups_all_super_admin"
  on public.groups
  for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

grant select, insert, update, delete on public.groups to authenticated;

alter table public.profiles
  add column group_id uuid references public.groups(id) on delete set null;

comment on column public.profiles.group_id is
  'Optional cohort/class grouping (e.g. "HADA class 2026 July"), used to bulk-assign bookings to every member at once. A user belongs to at most one group at a time.';

-- Narrow RPC so 'admin' (not just super_admin) can offer "assign a whole
-- group" when creating a booking — same reasoning as
-- list_profiles_for_booking() below: id+name only, nothing else.
create or replace function public.list_groups_for_booking()
returns table (id uuid, name text)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_admin_or_super() then
    raise exception 'not authorized';
  end if;
  return query select g.id, g.name from public.groups g order by g.name;
end;
$$;

grant execute on function public.list_groups_for_booking() to authenticated;

-- Extend the existing booking-picker RPC with group_id so the "New
-- booking" form can offer "select everyone in this group" without a
-- second admin-only surface — still only id/email/group_id, the same
-- narrow shape as before, just one column wider.
drop function if exists public.list_profiles_for_booking();
create or replace function public.list_profiles_for_booking()
returns table (id uuid, email text, group_id uuid)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_admin_or_super() then
    raise exception 'not authorized';
  end if;
  return query select p.id, p.email, p.group_id from public.profiles p order by p.email;
end;
$$;

grant execute on function public.list_profiles_for_booking() to authenticated;
