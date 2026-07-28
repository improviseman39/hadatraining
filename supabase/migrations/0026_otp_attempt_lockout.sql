-- verifyCode() previously compared the submitted code against every
-- unconsumed row with no cap on how many guesses a signed-in user could
-- make against their own outstanding 6-digit code — brute-forceable in
-- under 10^6 attempts with no lockout. Track attempts per outstanding code
-- and stop accepting guesses once a row is exhausted.
alter table public.login_otp_codes
  add column attempt_count int not null default 0;

comment on column public.login_otp_codes.attempt_count is
  'Failed verification attempts against this specific code. Locked out at MAX_OTP_ATTEMPTS (see verifyCode in onboarding.ts) — request a new code instead of retrying further.';
