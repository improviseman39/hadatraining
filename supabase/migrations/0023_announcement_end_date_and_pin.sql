-- Optional end date for multi-day seminars/events (blank = same day as
-- `date`, so existing one-day announcements are unaffected), and an admin
-- override to keep an announcement showing on the public site past its
-- date instead of it auto-hiding.
alter table public.announcements
  add column end_date date,
  add column always_visible boolean not null default false;
