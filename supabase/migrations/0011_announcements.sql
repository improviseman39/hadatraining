create table public.announcements (
  id           uuid primary key default gen_random_uuid(),
  category     text not null check (category in ('Seminar', 'News', 'Event')),
  title        text not null,
  description  text not null,
  date         date not null,
  image_id     text not null,
  href         text,
  position     integer not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index announcements_position_idx on public.announcements (position);

create trigger announcements_set_updated_at
  before update on public.announcements
  for each row execute function public.set_updated_at();

alter table public.announcements enable row level security;

-- Public read (news/promotions aren't locked content), admin-or-super write.
create policy "announcements_select_all"
  on public.announcements
  for select
  using (true);

create policy "announcements_admin_write"
  on public.announcements
  for all
  using (public.is_admin_or_super())
  with check (public.is_admin_or_super());

grant select on public.announcements to anon, authenticated;
grant insert, update, delete on public.announcements to authenticated;
