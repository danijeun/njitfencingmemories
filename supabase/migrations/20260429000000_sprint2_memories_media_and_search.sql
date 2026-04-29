-- Sprint 2 follow-up: inline media bucket for the Tiptap editor,
-- excerpt length guard, and full-text search for the command palette.

-- 1. Excerpt length guard. Server action slices to 280; mirror it in the DB.
alter table public.memories
  add constraint memories_excerpt_len
  check (excerpt is null or char_length(excerpt) <= 280);

-- 2. Full-text search. Generated tsvector over title (A) + excerpt (B),
--    English config. GIN index for fast websearch_to_tsquery().
alter table public.memories
  add column search tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(excerpt, '')), 'B')
  ) stored;

create index memories_search_idx on public.memories using gin (search);

-- Convenience RPC: callers pass a plain string, we run websearch_to_tsquery.
-- RLS on memories still applies to the underlying read.
create or replace function public.search_memories(q text, lim int default 20)
returns setof public.memories
language sql
stable
security invoker
set search_path = public
as $$
  select *
  from public.memories
  where search @@ websearch_to_tsquery('english', q)
    and (status = 'published' or author_id = (select auth.uid()))
  order by ts_rank(search, websearch_to_tsquery('english', q)) desc,
           published_at desc nulls last
  limit greatest(1, least(lim, 50));
$$;

grant execute on function public.search_memories(text, int) to authenticated;

-- 3. Inline media bucket for the Tiptap Image extension. Owner-scoped writes
--    under a {auth.uid}/ prefix; authed reads. Mirrors memory-covers.
insert into storage.buckets (id, name, public)
values ('memory-media', 'memory-media', false)
on conflict (id) do nothing;

create policy "memory-media read authenticated"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'memory-media');

create policy "memory-media insert own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'memory-media'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "memory-media update own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'memory-media'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "memory-media delete own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'memory-media'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
