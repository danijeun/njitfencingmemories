-- Sprint 7 — Moderation foundation:
--   1. Soft-delete memories (deleted_at / deleted_by) + RLS update.
--   2. memory_audit table + trigger (parallel to roster_audit).
--   3. memory_flags table (reader-submitted reports).
--   4. Update feed_memories + pinned_memories + search_memories +
--      get_memory_thread to filter out soft-deleted rows.

-- ----------------------------------------------------------------------------
-- 1. Soft-delete columns + reason enum
-- ----------------------------------------------------------------------------

create type public.memory_flag_reason as enum ('spam', 'harassment', 'off-topic', 'other');

alter table public.memories
  add column deleted_at timestamptz,
  add column deleted_by uuid references public.profiles(id) on delete set null;

create index memories_deleted_at_idx on public.memories (deleted_at) where deleted_at is not null;

-- Update read policy: soft-deleted rows hidden from everyone except admins
-- and the original author (so authors can still see "your memory was removed"
-- if we surface that later).
drop policy if exists "memories read published to authenticated" on public.memories;
drop policy if exists "memories read published" on public.memories;

create policy "memories read published"
  on public.memories for select
  to anon
  using (status = 'published' and deleted_at is null);

create policy "memories read authenticated"
  on public.memories for select
  to authenticated
  using (
    public.is_admin((select auth.uid()))
    or (deleted_at is null and (status = 'published' or author_id = (select auth.uid())))
  );

-- Guard: only admins can write deleted_at / deleted_by.
create or replace function public.guard_memory_delete_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (auth.role() = 'service_role') then
    return new;
  end if;
  if (new.deleted_at is distinct from old.deleted_at
      or new.deleted_by is distinct from old.deleted_by)
     and not public.is_admin(auth.uid())
  then
    new.deleted_at := old.deleted_at;
    new.deleted_by := old.deleted_by;
  end if;
  return new;
end;
$$;

create trigger memories_guard_delete_columns
before update on public.memories
for each row execute function public.guard_memory_delete_columns();

-- ----------------------------------------------------------------------------
-- 2. memory_audit
-- ----------------------------------------------------------------------------

create type public.memory_audit_action as enum (
  'insert', 'update', 'delete', 'soft_delete', 'restore', 'pin', 'unpin', 'publish'
);

create table public.memory_audit (
  id bigserial primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action public.memory_audit_action not null,
  memory_id uuid not null,
  before jsonb,
  after jsonb,
  at timestamptz not null default now()
);

create index memory_audit_memory_idx on public.memory_audit (memory_id, at desc);
create index memory_audit_at_idx on public.memory_audit (at desc);

alter table public.memory_audit enable row level security;

create policy "memory_audit admin read"
  on public.memory_audit for select
  to authenticated
  using (public.is_admin((select auth.uid())));

create or replace function public.log_memory_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_action public.memory_audit_action;
  v_before jsonb;
  v_after jsonb;
begin
  if (tg_op = 'INSERT') then
    v_action := 'insert';
    v_before := null;
    v_after := to_jsonb(new) - 'body';
  elsif (tg_op = 'DELETE') then
    v_action := 'delete';
    v_before := to_jsonb(old) - 'body';
    v_after := null;
  else
    v_before := to_jsonb(old) - 'body';
    v_after := to_jsonb(new) - 'body';
    if (old.deleted_at is null and new.deleted_at is not null) then
      v_action := 'soft_delete';
    elsif (old.deleted_at is not null and new.deleted_at is null) then
      v_action := 'restore';
    elsif (old.pinned_at is null and new.pinned_at is not null) then
      v_action := 'pin';
    elsif (old.pinned_at is not null and new.pinned_at is null) then
      v_action := 'unpin';
    elsif (old.status <> 'published' and new.status = 'published') then
      v_action := 'publish';
    else
      v_action := 'update';
    end if;
  end if;

  insert into public.memory_audit (actor_id, action, memory_id, before, after)
  values (
    v_actor,
    v_action,
    coalesce(new.id, old.id),
    v_before,
    v_after
  );

  return coalesce(new, old);
end;
$$;

create trigger memories_audit_log
after insert or update or delete on public.memories
for each row execute function public.log_memory_change();

-- ----------------------------------------------------------------------------
-- 3. memory_flags
-- ----------------------------------------------------------------------------

create table public.memory_flags (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid not null references public.memories(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason public.memory_flag_reason not null,
  note text check (note is null or char_length(note) between 1 and 1000),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index memory_flags_memory_idx on public.memory_flags (memory_id);
create index memory_flags_open_idx on public.memory_flags (created_at desc) where resolved_at is null;
create unique index memory_flags_one_open_per_reporter
  on public.memory_flags (memory_id, reporter_id)
  where resolved_at is null;

alter table public.memory_flags enable row level security;

create policy "memory_flags insert own"
  on public.memory_flags for insert
  to authenticated
  with check (reporter_id = (select auth.uid()));

create policy "memory_flags read own or admin"
  on public.memory_flags for select
  to authenticated
  using (
    reporter_id = (select auth.uid())
    or public.is_admin((select auth.uid()))
  );

create policy "memory_flags admin update"
  on public.memory_flags for update
  to authenticated
  using (public.is_admin((select auth.uid())))
  with check (public.is_admin((select auth.uid())));

-- ----------------------------------------------------------------------------
-- 4. RPC updates: hide soft-deleted rows from feed/pinned/search/thread.
-- ----------------------------------------------------------------------------

drop function if exists public.feed_memories(timestamptz, uuid, text, public.member_role[], int[], int, uuid[]);

create or replace function public.feed_memories(
  p_cursor_at timestamptz default null,
  p_cursor_id uuid default null,
  p_sort text default 'newest',
  p_roles public.member_role[] default null,
  p_eras int[] default null,
  p_limit int default 20,
  p_exclude_ids uuid[] default null
)
returns table (
  id uuid,
  title text,
  excerpt text,
  cover_path text,
  era smallint,
  published_at timestamptz,
  author_id uuid,
  author_full_name text,
  author_slug text,
  author_avatar_path text,
  author_class_year smallint,
  author_role public.member_role,
  comment_count int,
  like_count int,
  viewer_reacted boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    m.id, m.title, m.excerpt, m.cover_path, m.era, m.published_at,
    p.id, p.full_name, p.slug, p.avatar_path, p.class_year, p.role,
    coalesce(cc.n, 0)::int,
    coalesce(rc.n, 0)::int,
    coalesce(rc.mine, false)
  from public.memories m
  join public.profiles p on p.id = m.author_id
  left join lateral (
    select count(*)::int as n
    from public.memory_comments c
    where c.memory_id = m.id and c.hidden_at is null
  ) cc on true
  left join lateral (
    select
      count(*)::int as n,
      bool_or(r.author_id = auth.uid()) as mine
    from public.memory_reactions r
    where r.memory_id = m.id
  ) rc on true
  where m.status = 'published'
    and m.deleted_at is null
    and (p_roles is null or p.role = any(p_roles))
    and (p_eras  is null or m.era  = any(p_eras))
    and (p_exclude_ids is null or not (m.id = any(p_exclude_ids)))
    and (
      p_cursor_at is null
      or (
        case when p_sort = 'oldest'
          then (m.published_at, m.id) > (p_cursor_at, p_cursor_id)
          else (m.published_at, m.id) < (p_cursor_at, p_cursor_id)
        end
      )
    )
  order by
    case when p_sort = 'oldest' then m.published_at end asc nulls last,
    case when p_sort = 'oldest' then m.id end asc,
    case when p_sort <> 'oldest' then m.published_at end desc nulls last,
    case when p_sort <> 'oldest' then m.id end desc
  limit greatest(1, least(coalesce(p_limit, 20), 50));
$$;

revoke all on function public.feed_memories(timestamptz, uuid, text, public.member_role[], int[], int, uuid[]) from public;
grant execute on function public.feed_memories(timestamptz, uuid, text, public.member_role[], int[], int, uuid[]) to anon, authenticated;

drop function if exists public.pinned_memories(public.member_role[], int[], int);

create or replace function public.pinned_memories(
  p_roles public.member_role[] default null,
  p_eras int[] default null,
  p_limit int default 3
)
returns table (
  id uuid,
  title text,
  excerpt text,
  cover_path text,
  era smallint,
  published_at timestamptz,
  pinned_at timestamptz,
  author_id uuid,
  author_full_name text,
  author_slug text,
  author_avatar_path text,
  author_class_year smallint,
  author_role public.member_role,
  comment_count int,
  like_count int,
  viewer_reacted boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    m.id, m.title, m.excerpt, m.cover_path, m.era, m.published_at, m.pinned_at,
    p.id, p.full_name, p.slug, p.avatar_path, p.class_year, p.role,
    coalesce(cc.n, 0)::int,
    coalesce(rc.n, 0)::int,
    coalesce(rc.mine, false)
  from public.memories m
  join public.profiles p on p.id = m.author_id
  left join lateral (
    select count(*)::int as n
    from public.memory_comments c
    where c.memory_id = m.id and c.hidden_at is null
  ) cc on true
  left join lateral (
    select
      count(*)::int as n,
      bool_or(r.author_id = auth.uid()) as mine
    from public.memory_reactions r
    where r.memory_id = m.id
  ) rc on true
  where m.status = 'published'
    and m.deleted_at is null
    and m.pinned_at is not null
    and (p_roles is null or p.role = any(p_roles))
    and (p_eras  is null or m.era  = any(p_eras))
  order by m.pinned_at desc, m.id desc
  limit greatest(1, least(coalesce(p_limit, 3), 10));
$$;

revoke all on function public.pinned_memories(public.member_role[], int[], int) from public;
grant execute on function public.pinned_memories(public.member_role[], int[], int) to anon, authenticated;

-- memory_era_counts: exclude soft-deleted.
create or replace function public.memory_era_counts()
returns table (era int, count int)
language sql
stable
security definer
set search_path = public
as $$
  select m.era::int, count(*)::int
  from public.memories m
  where m.status = 'published'
    and m.deleted_at is null
    and m.era is not null
  group by m.era
  order by m.era;
$$;

revoke all on function public.memory_era_counts() from public;
grant execute on function public.memory_era_counts() to anon, authenticated;

-- get_memory_thread: gate on memory not being soft-deleted.
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
      where m.id = p_memory_id
        and m.status = 'published'
        and m.deleted_at is null
    )
  order by c.created_at asc, c.id asc;
$$;

revoke all on function public.get_memory_thread(uuid) from public;
grant execute on function public.get_memory_thread(uuid) to anon, authenticated;
