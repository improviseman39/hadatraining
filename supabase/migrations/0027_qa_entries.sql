-- Public Q&A entries, managed by admin/super_admin, readable by anyone.
-- Mirrors the announcements table's shape/conventions (position-ordered,
-- set_updated_at trigger, is_admin_or_super() for writes).

create table public.qa_entries (
  id           uuid primary key default gen_random_uuid(),
  question     text not null,
  answer       text not null,
  position     integer not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index qa_entries_position_idx on public.qa_entries (position);

create trigger qa_entries_set_updated_at
  before update on public.qa_entries
  for each row execute function public.set_updated_at();

alter table public.qa_entries enable row level security;

-- Public read (Q&A is meant to help visitors considering signing up, not
-- just existing members) - same openness as announcements.
create policy "qa_entries_select_all"
  on public.qa_entries
  for select
  using (true);

create policy "qa_entries_admin_write"
  on public.qa_entries
  for all
  using (public.is_admin_or_super())
  with check (public.is_admin_or_super());

grant select on public.qa_entries to anon, authenticated;
grant insert, update, delete on public.qa_entries to authenticated;
