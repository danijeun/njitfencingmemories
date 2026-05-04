-- Sprint 2: memories table, storage, RLS.

create type public.memory_status as enum ('draft', 'published');

create table public.memories (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  body jsonb not null default '{}'::jsonb,
  excerpt text,
  cover_path text,
  status public.memory_status not null default 'draft',
  era smallint check (era between 1980 and 2100),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index memories_published_at_idx
  on public.memories (published_at desc nulls last)
  where status = 'published';
create index memories_author_idx on public.memories (author_id);
create index memories_era_idx on public.memories (era);

create trigger memories_updated_at
before update on public.memories
for each row execute function public.handle_updated_at();

alter table public.memories enable row level security;

create policy "memories read published to authenticated"
  on public.memories for select
  to authenticated
  using (status = 'published' or author_id = (select auth.uid()));

create policy "memories insert own"
  on public.memories for insert
  to authenticated
  with check (author_id = (select auth.uid()));

create policy "memories update own"
  on public.memories for update
  to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));

create policy "memories delete own"
  on public.memories for delete
  to authenticated
  using (author_id = (select auth.uid()));

-- Cover images bucket. Owner-scoped writes, authed reads via signed URLs.
insert into storage.buckets (id, name, public)
values ('memory-covers', 'memory-covers', false)
on conflict (id) do nothing;

create policy "memory-covers read authenticated"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'memory-covers');

create policy "memory-covers insert own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'memory-covers'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "memory-covers update own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'memory-covers'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "memory-covers delete own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'memory-covers'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
