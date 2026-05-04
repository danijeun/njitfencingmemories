-- Sprint 1 admins: profile.is_admin flag, roster RLS for admins, audit log.

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

create index if not exists profiles_is_admin_idx
  on public.profiles (is_admin) where is_admin;

-- Helper: is the given user a platform admin?
-- SECURITY DEFINER so RLS policies on profiles do not recurse.
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = uid), false);
$$;

revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to authenticated;

-- Roster RLS: admins can fully manage; others remain locked out.
create policy "roster admin read"
  on public.roster for select
  to authenticated
  using (public.is_admin((select auth.uid())));

create policy "roster admin insert"
  on public.roster for insert
  to authenticated
  with check (public.is_admin((select auth.uid())));

create policy "roster admin update"
  on public.roster for update
  to authenticated
  using (public.is_admin((select auth.uid())))
  with check (public.is_admin((select auth.uid())));

create policy "roster admin delete"
  on public.roster for delete
  to authenticated
  using (public.is_admin((select auth.uid())));

-- Audit log of every roster mutation.
create table public.roster_audit (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null check (action in ('insert', 'update', 'delete')),
  email text not null,
  before jsonb,
  after jsonb,
  at timestamptz not null default now()
);

create index roster_audit_at_idx on public.roster_audit (at desc);
create index roster_audit_email_idx on public.roster_audit (email);

create or replace function public.log_roster_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
begin
  if (tg_op = 'INSERT') then
    insert into public.roster_audit (actor_id, action, email, after)
    values (actor, 'insert', new.email, to_jsonb(new));
    return new;
  elsif (tg_op = 'UPDATE') then
    insert into public.roster_audit (actor_id, action, email, before, after)
    values (actor, 'update', new.email, to_jsonb(old), to_jsonb(new));
    return new;
  elsif (tg_op = 'DELETE') then
    insert into public.roster_audit (actor_id, action, email, before)
    values (actor, 'delete', old.email, to_jsonb(old));
    return old;
  end if;
  return null;
end $$;

create trigger roster_audit_ins
  after insert on public.roster
  for each row execute function public.log_roster_change();

create trigger roster_audit_upd
  after update on public.roster
  for each row execute function public.log_roster_change();

create trigger roster_audit_del
  after delete on public.roster
  for each row execute function public.log_roster_change();

alter table public.roster_audit enable row level security;

create policy "roster_audit admin read"
  on public.roster_audit for select
  to authenticated
  using (public.is_admin((select auth.uid())));
-- No insert/update/delete policies: writes only via the SECURITY DEFINER trigger.

-- Bootstrap admins. Their profile rows are created on first sign-in by
-- handle_new_user(); we promote by email so this works whether or not they
-- have signed in yet. Re-runs are safe.
create or replace function public._bootstrap_admin(p_email text)
returns void
language plpgsql
as $$
begin
  update public.profiles
     set is_admin = true
   where lower(email) = lower(p_email);
end $$;

select public._bootstrap_admin('danijeun@gmail.com');
select public._bootstrap_admin('michael.bindas@njit.edu');

-- Also ensure a trigger to flip is_admin when these specific bootstrap emails
-- claim their account later. Idempotent: only fires for the seed addresses.
create or replace function public.handle_bootstrap_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if lower(new.email) in ('danijeun@gmail.com', 'michael.bindas@njit.edu') then
    new.is_admin := true;
  end if;
  return new;
end $$;

create trigger profiles_bootstrap_admin
  before insert on public.profiles
  for each row execute function public.handle_bootstrap_admin();

drop function public._bootstrap_admin(text);
