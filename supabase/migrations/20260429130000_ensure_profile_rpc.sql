-- Self-heal for users whose auth.users row predates their roster entry.
-- The handle_new_user trigger only fires on INSERT to auth.users, so users
-- who tried to sign in before being rostered never got a profile and were
-- stuck bouncing to /not-on-roster. This RPC lets the auth callback create
-- the profile lazily on any subsequent sign-in.

create or replace function public.ensure_profile_for_current_user()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  u_email text;
  r public.roster%rowtype;
begin
  if uid is null then
    return false;
  end if;

  if exists (select 1 from public.profiles where id = uid) then
    return true;
  end if;

  select email into u_email from auth.users where id = uid;
  if u_email is null then
    return false;
  end if;

  select * into r from public.roster where lower(email) = lower(u_email);
  if not found then
    return false;
  end if;

  insert into public.profiles (id, email, role, class_year, full_name)
  values (uid, r.email, r.role, r.class_year, r.full_name)
  on conflict (id) do nothing;

  update public.roster set claimed_at = now()
  where email = r.email and claimed_at is null;

  return true;
end $$;

revoke all on function public.ensure_profile_for_current_user() from public;
grant execute on function public.ensure_profile_for_current_user() to authenticated;

-- Backfill anyone currently stuck.
insert into public.profiles (id, email, role, class_year, full_name)
select u.id, r.email, r.role, r.class_year, r.full_name
from auth.users u
join public.roster r on lower(r.email) = lower(u.email)
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

update public.roster r
set claimed_at = now()
from public.profiles p
where p.email = r.email and r.claimed_at is null;
