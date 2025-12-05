-- Clear the username for the admin with the given email, keeping is_admin intact.
-- Run this in Supabase SQL editor.

-- Ensure column exists
alter table if not exists user_profiles add column if not exists username text;

with target as (
  select id from auth.users where email = 'nunofredericoteixeira@gmail.com' limit 1
)
update user_profiles
set username = null
where id in (select id from target);

-- Optional: verify
select id, username, is_admin from user_profiles where id in (select id from target);
