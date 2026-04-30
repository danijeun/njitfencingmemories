-- Public memories: anyone can read published memories; writes still require
-- a profile (i.e. an email on the roster).

-- 1. Anon SELECT on published memories.
create policy "memories read published to anon"
  on public.memories for select
  to anon
  using (status = 'published');

-- 2. Public-safe profile lookup for memory attribution. profiles RLS still
--    blocks anon, so expose only the safe columns via SECURITY DEFINER RPCs.
create or replace function public.get_public_profile(p_id uuid)
returns table (
  id uuid,
  full_name text,
  slug text,
  avatar_path text,
  class_year smallint,
  role public.member_role
)
language sql
stable
security definer
set search_path = public
as $$
  select id, full_name, slug, avatar_path, class_year, role
  from public.profiles
  where id = p_id;
$$;

create or replace function public.get_public_profiles(p_ids uuid[])
returns table (
  id uuid,
  full_name text,
  slug text,
  avatar_path text,
  class_year smallint,
  role public.member_role
)
language sql
stable
security definer
set search_path = public
as $$
  select id, full_name, slug, avatar_path, class_year, role
  from public.profiles
  where id = any(p_ids);
$$;

revoke all on function public.get_public_profile(uuid) from public;
revoke all on function public.get_public_profiles(uuid[]) from public;
grant execute on function public.get_public_profile(uuid) to anon, authenticated;
grant execute on function public.get_public_profiles(uuid[]) to anon, authenticated;

-- 3. Search RPC: callable by anon. The existing where-clause already filters
--    drafts for non-authors (auth.uid() is null for anon, so only published
--    rows match), so no body change is required — just grant execute.
grant execute on function public.search_memories(text, int) to anon;

-- 4. Make memory media buckets public so anon visitors can load covers and
--    inline images directly without signed URLs. Drop the now-redundant
--    authenticated-read policies. Owner-scoped write policies are kept.
update storage.buckets set public = true where id in ('memory-covers', 'memory-media');

drop policy if exists "memory-covers read authenticated" on storage.objects;
drop policy if exists "memory-media read authenticated" on storage.objects;
