-- Aggregate era counts over published memories for the timeline rail.
-- SECURITY DEFINER so anon visitors get the same view the public feed exposes.
create or replace function public.memory_era_counts()
returns table (era smallint, count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select era, count(*)::bigint as count
  from public.memories
  where status = 'published' and era is not null
  group by era
  order by era;
$$;

revoke all on function public.memory_era_counts() from public;
grant execute on function public.memory_era_counts() to anon, authenticated;
