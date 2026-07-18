-- Run this ONCE, by hand, after creating your first user via the Supabase
-- dashboard (Authentication → Users → Add user). Edit the email below first.
--
-- This is a manual bootstrap step because Phase 1 has no invite UI yet —
-- every subsequent account will be created via the Phase 3 admin dashboard,
-- which sets the role at creation time instead of needing this UPDATE.

update public.profiles
set role = 'super_admin'
where email = 'your-email@example.com';
