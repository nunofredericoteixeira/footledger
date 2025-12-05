-- Clear the username for the admin with the given email, keeping is_admin intact.
-- Run this in the Supabase SQL editor.

-- Add column if missing
alter table user_profiles add column if not exists username text;

-- Clear username for the target user
update user_profiles
set username = null
where id in (select id from auth.users where email = 'nunofredericoteixeira@gmail.com' limit 1);

-- Optional: verify
select id, username, is_admin
from user_profiles
where id in (select id from auth.users where email = 'nunofredericoteixeira@gmail.com' limit 1);
