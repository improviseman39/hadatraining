-- Public self-signup: no pre-compiled email list exists, so the site owner
-- shares the URL directly and people register themselves. Adds the profile
-- fields collected at signup, and extends the existing auto-provisioning
-- trigger to populate them from user_metadata (self-signup passes them;
-- admin-invited/created accounts simply omit them).

alter table public.profiles
  add column full_name text,
  add column phone text,
  add column is_clinic_owner boolean not null default false,
  add column clinic_name text,
  add column position text,
  add column province text,
  add column class_year text;

comment on column public.profiles.position is
  'Professional role: doctor, nurse, aesthetician, clinic_manager, student, other.';
comment on column public.profiles.class_year is
  'Which HADA training cohort/year the person belongs to, e.g. 2024.';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (
    id, email, role, invited_by,
    full_name, phone, is_clinic_owner, clinic_name, position, province, class_year
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'role', 'user'),
    nullif(new.raw_user_meta_data ->> 'invited_by', '')::uuid,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone',
    coalesce((new.raw_user_meta_data ->> 'is_clinic_owner')::boolean, false),
    new.raw_user_meta_data ->> 'clinic_name',
    new.raw_user_meta_data ->> 'position',
    new.raw_user_meta_data ->> 'province',
    new.raw_user_meta_data ->> 'class_year'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
