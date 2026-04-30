-- Paginated feed RPC for /memories. Keyset pagination on (published_at, id),
-- inline join to the public profile columns so anon visitors can attribute
-- without an extra round trip. Filters: roles[], eras[], sort.
create or replace function public.feed_memories(
  p_cursor_at timestamptz default null,
  p_cursor_id uuid default null,
  p_sort text default 'newest',
  p_roles public.member_role[] default null,
  p_eras int[] default null,
  p_limit int default 20
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
  author_role public.member_role
)
language sql
stable
security definer
set search_path = public
as $$
  select
    m.id, m.title, m.excerpt, m.cover_path, m.era, m.published_at,
    p.id, p.full_name, p.slug, p.avatar_path, p.class_year, p.role
  from public.memories m
  join public.profiles p on p.id = m.author_id
  where m.status = 'published'
    and (p_roles is null or p.role = any(p_roles))
    and (p_eras  is null or m.era  = any(p_eras))
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

revoke all on function public.feed_memories(timestamptz, uuid, text, public.member_role[], int[], int) from public;
grant execute on function public.feed_memories(timestamptz, uuid, text, public.member_role[], int[], int) to anon, authenticated;
