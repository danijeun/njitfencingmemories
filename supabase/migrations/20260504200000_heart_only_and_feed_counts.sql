-- Sprint 4 follow-up:
--   1. Narrow memory_reactions to a single heart emoji (product decision).
--   2. Extend feed_memories + pinned_memories with comment_count, like_count,
--      and viewer_reacted so feed cards can render real counters and a
--      working heart toggle without N+1 round trips.

-- ----------------------------------------------------------------------------
-- 1. Heart-only reactions.
-- ----------------------------------------------------------------------------

delete from public.memory_reactions where emoji <> '❤️';

alter table public.memory_reactions
  drop constraint if exists memory_reactions_emoji_check;

alter table public.memory_reactions
  add constraint memory_reactions_emoji_check check (emoji = '❤️');

-- ----------------------------------------------------------------------------
-- 2a. feed_memories with counts.
-- Drop old signature; add three new columns. auth.uid() works inside SECURITY
-- DEFINER functions (it reads the JWT, not the session role) so viewer_reacted
-- reflects the calling user, not the function owner.
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
    coalesce(cc.n, 0)::int as comment_count,
    coalesce(rc.n, 0)::int as like_count,
    coalesce(rc.mine, false) as viewer_reacted
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

-- ----------------------------------------------------------------------------
-- 2b. pinned_memories with counts.
-- ----------------------------------------------------------------------------

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
    coalesce(cc.n, 0)::int as comment_count,
    coalesce(rc.n, 0)::int as like_count,
    coalesce(rc.mine, false) as viewer_reacted
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
    and m.pinned_at is not null
    and (p_roles is null or p.role = any(p_roles))
    and (p_eras  is null or m.era  = any(p_eras))
  order by m.pinned_at desc, m.id desc
  limit greatest(1, least(coalesce(p_limit, 3), 10));
$$;

revoke all on function public.pinned_memories(public.member_role[], int[], int) from public;
grant execute on function public.pinned_memories(public.member_role[], int[], int) to anon, authenticated;
