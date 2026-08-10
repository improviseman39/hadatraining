-- Adds a fourth, narrower role ("design") that can only touch a curated set
-- of sitewide branding settings (logo, header text, brand color, fonts) —
-- everything else in /admin stays exactly as gated as it is today.

alter table public.profiles
  drop constraint profiles_role_check,
  add constraint profiles_role_check
    check (role in ('super_admin', 'admin', 'user', 'design'));

comment on column public.profiles.role is
  'One of: super_admin, admin, user, design (design is scoped to /admin/design only, see requireRole call sites).';

-- Mirrors is_admin_or_super() in 0007_admin_helper_functions.sql — same
-- security-definer pattern to avoid recursive RLS on profiles.
create or replace function public.is_design_or_admin_or_super()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('design', 'admin', 'super_admin')
  );
$$;

grant execute on function public.is_design_or_admin_or_super() to authenticated;

-- Single-row sitewide branding settings. Selected by every page (including
-- logged-out visitors) to render the header/footer and brand color/fonts;
-- only design/admin/super_admin can update it.
create table public.site_settings (
  id                  boolean primary key default true,
  header_title        text not null default 'HADA',
  header_subtitle     text not null default 'Aesthetic Training',
  logo_storage_path   text,
  primary_color       text not null default '#3D6B66',
  primary_color_dark  text not null default '#2E5450',
  heading_font        text not null default 'fraunces'
                        check (heading_font in ('fraunces', 'playfair', 'lora')),
  body_font           text not null default 'inter'
                        check (body_font in ('inter', 'system')),
  updated_at          timestamptz not null default now(),
  updated_by          uuid references public.profiles(id) on delete set null,
  constraint site_settings_singleton check (id)
);

comment on table public.site_settings is
  'Single-row sitewide branding settings, editable from /admin/design. id is always true — the singleton check + primary key makes a second row impossible.';

insert into public.site_settings (id) values (true);

create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

alter table public.site_settings enable row level security;

create policy "site_settings_select_all"
  on public.site_settings for select using (true);

create policy "site_settings_design_write"
  on public.site_settings for update
  using (public.is_design_or_admin_or_super())
  with check (public.is_design_or_admin_or_super());

grant select on public.site_settings to anon, authenticated;
grant update on public.site_settings to authenticated;

-- Public bucket for the site logo — same shape as announcement-images
-- (0021_announcement_media.sql), just gated by the wider design/admin/super
-- helper instead of admin/super only.
insert into storage.buckets (id, name, public)
values ('branding-images', 'branding-images', true)
on conflict (id) do nothing;

create policy "branding_images_design_write"
  on storage.objects
  for all
  to authenticated
  using (bucket_id = 'branding-images' and public.is_design_or_admin_or_super())
  with check (bucket_id = 'branding-images' and public.is_design_or_admin_or_super());

create policy "branding_images_public_read"
  on storage.objects
  for select
  to public
  using (bucket_id = 'branding-images');
