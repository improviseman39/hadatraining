-- Mandatory first-login chain: verify email by OTP, replace the
-- admin-issued temporary password, enroll TOTP 2FA. MFA enrollment itself
-- uses Supabase's native auth.mfa.* — no custom table needed there. Email
-- verification needs a small dedicated table because the desired order
-- (log in with temp password FIRST, confirm by email SECOND) doesn't map
-- onto Supabase's built-in signup-confirmation flow, which gates sign-in
-- itself rather than a post-login step.

alter table public.profiles
  add column must_change_password boolean not null default true,
  add column email_verified_at timestamptz,
  add column onboarding_exempt boolean not null default false;

comment on column public.profiles.must_change_password is
  'true for every new profile (any creation path) and reset back to true whenever an admin issues a new temporary password. Cleared by the user completing /onboarding/set-password.';
comment on column public.profiles.email_verified_at is
  'Set by completing the custom OTP flow — the sole source of truth for the onboarding gate''s email-verification step. Deliberately NOT tied to auth.users.email_confirmed_at: every account (createUserDirect or admin API) must have email_confirm=true regardless, since Supabase''s GoTrue hard-blocks signInWithPassword for unconfirmed accounts independent of the enable_confirmations config setting. Using email_confirmed_at here would let every admin-created account skip the OTP step entirely.';
comment on column public.profiles.onboarding_exempt is
  'true only for accounts that already existed before this feature shipped — bypasses the entire onboarding gate (OTP, forced password change, AND mfa_enrolled), since retroactively demanding 2FA from already-active accounts is a separate decision from requiring it on new ones. Never set true for a newly created account.';

-- Grandfather in every account that already existed before this feature —
-- only NEW accounts going forward should be forced through onboarding,
-- including the 2FA requirement (a pre-existing account has never had a
-- reason to enroll a factor, so mfa_enrolled alone would otherwise still
-- catch every one of them).
update public.profiles set must_change_password = false, email_verified_at = now(), onboarding_exempt = true;

create table public.login_otp_codes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  code_hash   text not null,
  expires_at  timestamptz not null,
  consumed_at timestamptz,
  created_at  timestamptz not null default now()
);

create index login_otp_codes_user_id_idx on public.login_otp_codes (user_id);

comment on column public.login_otp_codes.code_hash is
  'sha256 of the 6-digit code — never store the raw code.';

alter table public.login_otp_codes enable row level security;

grant select, insert, update on public.login_otp_codes to authenticated;

create policy "login_otp_codes_own"
  on public.login_otp_codes
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- No delete policy or grant: expired/consumed rows are just left behind,
-- same low-ceremony approach as other append-only tables in this schema.

-- Single round-trip status check for the middleware onboarding gate —
-- avoids a separate profiles query plus a separate GoTrue listFactors()
-- call on every authenticated request.
create or replace function public.get_onboarding_status()
returns table (
  onboarding_exempt boolean,
  must_change_password boolean,
  email_verified boolean,
  mfa_enrolled boolean
)
language sql
security definer
set search_path = public
stable
as $$
  select
    p.onboarding_exempt,
    p.must_change_password,
    (p.email_verified_at is not null) as email_verified,
    exists (
      select 1 from auth.mfa_factors f
      where f.user_id = auth.uid() and f.status = 'verified'
    ) as mfa_enrolled
  from public.profiles p
  where p.id = auth.uid();
$$;

grant execute on function public.get_onboarding_status() to authenticated;

