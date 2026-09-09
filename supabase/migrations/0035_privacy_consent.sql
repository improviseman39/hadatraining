-- Privacy policy consent, captured once at registration (individual signup
-- or a class-login seat's first-time-on-device form) — never retroactively
-- demanded from an account that already existed before this shipped, same
-- reasoning as onboarding_exempt in 0019_onboarding_and_mfa.sql.

alter table public.profiles
  add column privacy_accepted_at timestamptz,
  add column privacy_policy_version text;

comment on column public.profiles.privacy_accepted_at is
  'Set the moment a new registrant checks "I agree" on the privacy consent popup — never backfilled for an account created before this feature shipped, and never required again later just because the policy text changes.';
comment on column public.profiles.privacy_policy_version is
  'Which policy version (see src/app/privacy-policy/page.tsx) the person agreed to — kept for an audit trail, not enforced against the current version.';

-- Grandfather every existing account so only new registrations are asked.
update public.profiles
  set privacy_accepted_at = now(), privacy_policy_version = 'v1'
  where privacy_accepted_at is null;
