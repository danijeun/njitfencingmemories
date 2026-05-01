-- Access requests: public submission form for off-roster users.
-- Admins triage from /admin/requests; on approve we insert into roster
-- (which fires the existing log_roster_change audit trigger).

create extension if not exists citext;

create type public.request_status as enum ('pending', 'approved', 'declined');

create table public.access_requests (
  id uuid primary key default gen_random_uuid(),
  email citext not null,
  full_name text not null check (length(trim(full_name)) > 0),
  status public.request_status not null default 'pending',
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references public.profiles(id) on delete set null
);

create index access_requests_status_requested_idx
  on public.access_requests (status, requested_at desc);
create index access_requests_email_idx on public.access_requests (email);

alter table public.access_requests enable row level security;

-- Anyone (including anon) can submit a request.
create policy "access_requests public insert"
  on public.access_requests for insert
  to anon, authenticated
  with check (status = 'pending' and decided_at is null and decided_by is null);

create policy "access_requests admin read"
  on public.access_requests for select
  to authenticated
  using (public.is_admin((select auth.uid())));

create policy "access_requests admin update"
  on public.access_requests for update
  to authenticated
  using (public.is_admin((select auth.uid())))
  with check (public.is_admin((select auth.uid())));

-- Approve in one transaction: insert into roster, mark request approved.
-- Caller must be admin; we re-check inside the function to prevent abuse
-- of the SECURITY DEFINER bypass.
create or replace function public.approve_access_request(
  p_id uuid,
  p_role public.member_role,
  p_class_year int
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_email citext;
  v_full_name text;
begin
  if not public.is_admin(v_actor) then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select email, full_name
    into v_email, v_full_name
    from public.access_requests
   where id = p_id and status = 'pending'
   for update;

  if not found then
    raise exception 'request not found or not pending' using errcode = 'P0002';
  end if;

  insert into public.roster (email, role, class_year, full_name, invited_at)
  values (lower(trim(v_email::text)), p_role, p_class_year, v_full_name, now());

  update public.access_requests
     set status = 'approved',
         decided_at = now(),
         decided_by = v_actor
   where id = p_id;
end $$;

revoke all on function public.approve_access_request(uuid, public.member_role, int) from public;
grant execute on function public.approve_access_request(uuid, public.member_role, int) to authenticated;
