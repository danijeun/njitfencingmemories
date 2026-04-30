-- Anon-callable membership check so the login page can avoid emailing
-- magic links to addresses that aren't on the roster. RLS on roster
-- denies anon, so this is SECURITY DEFINER and only returns a boolean.

create or replace function public.is_email_on_roster(p_email text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.roster
    where lower(email) = lower(trim(p_email))
  );
$$;

revoke all on function public.is_email_on_roster(text) from public;
grant execute on function public.is_email_on_roster(text) to anon, authenticated;
