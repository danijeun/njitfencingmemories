-- Sprint 1: roster-gated auth, profiles, avatars storage.

create type public.member_role as enum ('athlete', 'alumni');

create table public.roster (
  email text primary key,
  role public.member_role not null,
  class_year smallint not null check (class_year between 1980 and 2100),
  full_name text not null,
  invited_at timestamptz not null default now(),
  claimed_at timestamptz
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique references public.roster(email) on update cascade,
  role public.member_role not null,
  class_year smallint not null,
  full_name text not null,
  major text,
  avatar_path text,
  bio text,
  slug text unique,
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_slug_idx on public.profiles (slug);

create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger profiles_updated_at
before update on public.profiles
for each row execute function public.handle_updated_at();

-- On new auth user, if email is on roster, create the profile shell.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.roster%rowtype;
begin
  select * into r from public.roster where lower(email) = lower(new.email);
  if not found then
    return new; -- proxy/callback will sign them out and show /not-on-roster
  end if;

  insert into public.profiles (id, email, role, class_year, full_name)
  values (new.id, r.email, r.role, r.class_year, r.full_name)
  on conflict (id) do nothing;

  update public.roster set claimed_at = now() where email = r.email and claimed_at is null;
  return new;
end $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- RLS
alter table public.roster enable row level security;
alter table public.profiles enable row level security;

-- roster: no client access. Service role bypasses RLS automatically.
-- (no policies = deny all for anon/authenticated)

-- profiles: any signed-in member can read; only owner can update.
create policy "profiles read for authenticated"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles update own"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Storage: avatars bucket, owner-scoped writes, public-ish reads (authed only via signed URLs in app).
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', false)
on conflict (id) do nothing;

create policy "avatars read authenticated"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'avatars');

create policy "avatars insert own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "avatars update own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "avatars delete own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
