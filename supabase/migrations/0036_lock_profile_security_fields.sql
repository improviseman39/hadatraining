-- Security fix: a signed-in user could edit their own onboarding / security
-- flags straight through the public API, because profiles_update_own_non_role_fields
-- (0001) only pins `role`. Setting onboarding_exempt = true skipped email
-- verification, the forced password change AND 2FA enrollment.
--
-- A trigger rather than column-level GRANTs: super_admins still edit
-- group_id / must_change_password through the normal client (0008 policy),
-- and a column grant can't tell a super_admin from a student.

create or replace function public.protect_profile_security_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- auth.uid() is null for the service-role key, migrations and the SQL
  -- editor — i.e. server-side code and operators, never a signed-in user.
  if auth.uid() is null or public.is_super_admin() then
    return new;
  end if;

  if new.must_change_password is distinct from old.must_change_password
     or new.email_verified_at is distinct from old.email_verified_at
     or new.onboarding_exempt is distinct from old.onboarding_exempt
     or new.group_id is distinct from old.group_id then
    raise exception 'These account fields can only be changed by the server.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_protect_security_fields on public.profiles;
create trigger profiles_protect_security_fields
  before update on public.profiles
  for each row execute function public.protect_profile_security_fields();

-- The email-code table was fully writable by its own user, so someone could
-- insert a pre-consumed "verified" code and use it as proof of identity
-- (e.g. for the self-serve 2FA reset). Only server-side code (service role,
-- which bypasses RLS) reads or writes it now.
drop policy if exists "login_otp_codes_own" on public.login_otp_codes;
revoke select, insert, update on public.login_otp_codes from authenticated;

-- Server-side code now does these writes (see onboarding.ts, confirmToken.ts,
-- signup/actions.ts). Spelled out so it works on any database, not only ones
-- whose default privileges happen to already cover the service role.
grant select, update on public.profiles to service_role;
grant select, insert, update on public.login_otp_codes to service_role;
