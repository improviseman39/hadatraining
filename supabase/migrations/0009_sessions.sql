create table public.sessions (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  title       text not null,
  category    text not null check (category in ('Foundations', 'Injectables', 'Devices', 'Safety')),
  summary     text not null,
  duration    text not null,
  image_id    text not null,
  is_free     boolean not null default false,
  position    integer not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index sessions_position_idx on public.sessions (position);

comment on column public.sessions.position is
  'Global display/ordering index (matches the old static "order" field). No unique constraint — reorder mutations renumber the whole affected set in one transaction rather than swapping two values, to avoid transient unique-index collisions.';
comment on column public.sessions.image_id is
  'Unsplash photo id, rendered via the existing unsplashUrl() helper. No real upload pipeline yet.';

-- Reuses set_updated_at() already created by 0001_profiles_and_roles.sql.
create trigger sessions_set_updated_at
  before update on public.sessions
  for each row execute function public.set_updated_at();

alter table public.sessions enable row level security;

-- Metadata is public: the homepage curriculum grid must show every
-- session (with lock badges) to logged-out visitors too.
create policy "sessions_select_all"
  on public.sessions
  for select
  using (true);

create policy "sessions_admin_write"
  on public.sessions
  for all
  using (public.is_admin_or_super())
  with check (public.is_admin_or_super());

grant select on public.sessions to anon, authenticated;
grant insert, update, delete on public.sessions to authenticated;
