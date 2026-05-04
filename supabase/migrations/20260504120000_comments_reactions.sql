-- Sprint 4 step 1: comments + reactions schema, RLS, hidden-column guard,
-- public-read RPC, and Realtime publication. App-side wiring (server actions,
-- thread component, channel hook) lands in subsequent steps.

-- ----------------------------------------------------------------------------
-- memory_comments
-- ----------------------------------------------------------------------------

create table public.memory_comments (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid not null references public.memories(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  hidden_at timestamptz,
  hidden_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index memory_comments_memory_idx
  on public.memory_comments (memory_id, created_at);

create trigger memory_comments_updated_at
before update on public.memory_comments
for each row execute function public.handle_updated_at();

alter table public.memory_comments enable row level security;

create policy "memory_comments select visible"
  on public.memory_comments for select
  to anon, authenticated
  using (
    (
      hidden_at is null
      and exists (
        select 1 from public.memories m
        where m.id = memory_comments.memory_id and m.status = 'published'
      )
    )
    or author_id = (select auth.uid())
    or public.is_admin((select auth.uid()))
  );

create policy "memory_comments insert own"
  on public.memory_comments for insert
  to authenticated
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1 from public.memories m
      where m.id = memory_comments.memory_id and m.status = 'published'
    )
  );

create policy "memory_comments update owner or admin"
  on public.memory_comments for update
  to authenticated
  using (
    author_id = (select auth.uid())
    or public.is_admin((select auth.uid()))
  )
  with check (
    author_id = (select auth.uid())
    or public.is_admin((select auth.uid()))
  );

create policy "memory_comments delete owner or admin"
  on public.memory_comments for delete
  to authenticated
  using (
    author_id = (select auth.uid())
    or public.is_admin((select auth.uid()))
  );

-- WITH CHECK can't see OLD; enforce hidden-column immutability for non-admins
-- via BEFORE UPDATE trigger. Same pattern as guard_memory_pin_columns.
create or replace function public.guard_comment_hidden_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (auth.role() = 'service_role') then
    return new;
  end if;
  if (new.hidden_at is distinct from old.hidden_at
      or new.hidden_by is distinct from old.hidden_by)
     and not public.is_admin(auth.uid())
  then
    new.hidden_at := old.hidden_at;
    new.hidden_by := old.hidden_by;
  end if;
  return new;
end;
$$;

create trigger memory_comments_guard_hidden_columns
before update on public.memory_comments
for each row execute function public.guard_comment_hidden_columns();

-- ----------------------------------------------------------------------------
-- memory_reactions
-- ----------------------------------------------------------------------------

create table public.memory_reactions (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid not null references public.memories(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  emoji text not null check (emoji in ('❤️','🎉','🔥','💪','🦅')),
  created_at timestamptz not null default now(),
  unique (memory_id, author_id, emoji)
);

create index memory_reactions_memory_idx
  on public.memory_reactions (memory_id);

alter table public.memory_reactions enable row level security;

create policy "memory_reactions select published"
  on public.memory_reactions for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.memories m
      where m.id = memory_reactions.memory_id and m.status = 'published'
    )
  );

create policy "memory_reactions insert own"
  on public.memory_reactions for insert
  to authenticated
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1 from public.memories m
      where m.id = memory_reactions.memory_id and m.status = 'published'
    )
  );

create policy "memory_reactions delete own"
  on public.memory_reactions for delete
  to authenticated
  using (author_id = (select auth.uid()));

-- ----------------------------------------------------------------------------
-- get_memory_thread RPC: anon-readable thread with author attribution.
-- Mirrors the pinned_memories projection style.
-- ----------------------------------------------------------------------------

create or replace function public.get_memory_thread(p_memory_id uuid)
returns table (
  comment_id uuid,
  body text,
  hidden_at timestamptz,
  created_at timestamptz,
  author_id uuid,
  author_full_name text,
  author_slug text,
  author_avatar_path text,
  author_role public.member_role,
  author_class_year smallint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id, c.body, c.hidden_at, c.created_at,
    p.id, p.full_name, p.slug, p.avatar_path, p.role, p.class_year
  from public.memory_comments c
  join public.profiles p on p.id = c.author_id
  where c.memory_id = p_memory_id
    and c.hidden_at is null
    and exists (
      select 1 from public.memories m
      where m.id = p_memory_id and m.status = 'published'
    )
  order by c.created_at asc, c.id asc;
$$;

revoke all on function public.get_memory_thread(uuid) from public;
grant execute on function public.get_memory_thread(uuid) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- Realtime publication. Idempotent: ignore "already member" on re-run.
-- ----------------------------------------------------------------------------

do $$
begin
  alter publication supabase_realtime add table public.memory_comments;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.memory_reactions;
exception when others then null;
end $$;
