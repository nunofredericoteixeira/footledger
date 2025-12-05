-- Clear the username for the admin with the given email, keeping is_admin intact.
-- Run this in Supabase SQL editor.

-- Ensure column exists (safe if already present)
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_name = 'user_profiles'
      and column_name = 'username'
  ) then
    alter table user_profiles add column username text;
  end if;
end;
$$;

with target as (
  select id from auth.users where email = 'nunofredericoteixeira@gmail.com' limit 1
)
update user_profiles
set username = null
where id in (select id from target);

-- Optional: verify
select id, username, is_admin from user_profiles where id in (select id from target);
