-- Memory pinning: admins surface up to 3 published memories at the top of /memories.
-- Adds pinned_at / pinned_by columns, a partial index for the (small) pinned set,
-- an admin-only update policy, and a trigger that prevents non-admin authors from
-- modifying the pin columns via their existing "update own" policy.

alter table public.memories
  add column pinned_at timestamptz,
  add column pinned_by uuid references public.profiles(id) on delete set null;

create index memories_pinned_idx
  on public.memories (pinned_at desc, id desc)
  where pinned_at is not null and status = 'published';

create policy "memories admin update"
  on public.memories for update
  to authenticated
  using (public.is_admin((select auth.uid())))
  with check (public.is_admin((select auth.uid())));

-- Guard: WITH CHECK in RLS can't see OLD, so enforce pin-column immutability for
-- non-admins via a BEFORE UPDATE trigger. Bootstrap admins and the service role
-- bypass (service role short-circuits RLS but still hits triggers, so we let it
-- through explicitly).
create or replace function public.guard_memory_pin_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (auth.role() = 'service_role') then
    return new;
  end if;
  if (new.pinned_at is distinct from old.pinned_at
      or new.pinned_by is distinct from old.pinned_by)
     and not public.is_admin(auth.uid())
  then
    new.pinned_at := old.pinned_at;
    new.pinned_by := old.pinned_by;
  end if;
  return new;
end;
$$;

create trigger memories_guard_pin_columns
before update on public.memories
for each row execute function public.guard_memory_pin_columns();

-- Replace feed_memories to add p_exclude_ids so the unpinned feed can omit the
-- pinned set the page renders separately above it. Signature change requires a
-- DROP because Postgres can't redefine a function with new params + defaults.
drop function if exists public.feed_memories(timestamptz, uuid, text, public.member_role[], int[], int);

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

-- Pinned-memories listing. Same projection as feed_memories plus pinned_at,
-- ordered most-recently-pinned first. Honors role/era filters so a filtered
-- feed doesn't show pins from other roles/eras.
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
  author_role public.member_role
)
language sql
stable
security definer
set search_path = public
as $$
  select
    m.id, m.title, m.excerpt, m.cover_path, m.era, m.published_at, m.pinned_at,
    p.id, p.full_name, p.slug, p.avatar_path, p.class_year, p.role
  from public.memories m
  join public.profiles p on p.id = m.author_id
  where m.status = 'published'
    and m.pinned_at is not null
    and (p_roles is null or p.role = any(p_roles))
    and (p_eras  is null or m.era  = any(p_eras))
  order by m.pinned_at desc, m.id desc
  limit greatest(1, least(coalesce(p_limit, 3), 10));
$$;

revoke all on function public.pinned_memories(public.member_role[], int[], int) from public;
grant execute on function public.pinned_memories(public.member_role[], int[], int) to anon, authenticated;
