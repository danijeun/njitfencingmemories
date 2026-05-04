import { createClient } from "@/lib/supabase/server";
import { signedAvatarUrls } from "@/lib/storage/avatars";
import { coverUrl } from "@/lib/storage/publicUrl";

export type FeedSort = "newest" | "oldest";
export type FeedRole = "athlete" | "alumni" | "coach";

export type FeedFilters = {
  sort: FeedSort;
  roles: FeedRole[];
  eras: number[];
};

export type FeedItem = {
  id: string;
  title: string;
  excerpt: string | null;
  cover_path: string | null;
  era: number | null;
  published_at: string | null;
  pinned_at: string | null;
  author: {
    id: string;
    full_name: string | null;
    slug: string | null;
    avatar_path: string | null;
    class_year: number | null;
    role: FeedRole | null;
    avatar_url: string | null;
  };
  cover_url: string | null;
};

export type FeedCursor = { at: string; id: string } | null;

export type FeedPage = {
  items: FeedItem[];
  nextCursor: FeedCursor;
};

const PAGE_SIZE = 20;
export const PINNED_LIMIT = 3;

export async function fetchFeedPage(
  filters: FeedFilters,
  cursor: FeedCursor,
  excludeIds: string[] = [],
): Promise<FeedPage> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("feed_memories", {
    p_cursor_at: cursor?.at ?? null,
    p_cursor_id: cursor?.id ?? null,
    p_sort: filters.sort,
    p_roles: filters.roles.length ? filters.roles : null,
    p_eras: filters.eras.length ? filters.eras : null,
    p_limit: PAGE_SIZE,
    p_exclude_ids: excludeIds.length ? excludeIds : null,
  });
  if (error) {
    console.error("feed_memories", error);
    return { items: [], nextCursor: null };
  }
  const rows = (data ?? []) as Array<{
    id: string;
    title: string;
    excerpt: string | null;
    cover_path: string | null;
    era: number | null;
    published_at: string | null;
    author_id: string;
    author_full_name: string | null;
    author_slug: string | null;
    author_avatar_path: string | null;
    author_class_year: number | null;
    author_role: FeedRole | null;
  }>;
  const avatarMap = await signedAvatarUrls(
    supabase,
    rows.map((r) => r.author_avatar_path),
  );
  const items: FeedItem[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    excerpt: r.excerpt,
    cover_path: r.cover_path,
    era: r.era,
    published_at: r.published_at,
    pinned_at: null,
    cover_url: r.cover_path ? coverUrl(r.cover_path) : null,
    author: {
      id: r.author_id,
      full_name: r.author_full_name,
      slug: r.author_slug,
      avatar_path: r.author_avatar_path,
      class_year: r.author_class_year,
      role: r.author_role,
      avatar_url: r.author_avatar_path ? (avatarMap.get(r.author_avatar_path) ?? null) : null,
    },
  }));
  const last = items[items.length - 1];
  const nextCursor: FeedCursor =
    items.length === PAGE_SIZE && last?.published_at
      ? { at: last.published_at, id: last.id }
      : null;
  return { items, nextCursor };
}

export async function fetchPinnedMemories(filters: FeedFilters): Promise<FeedItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("pinned_memories", {
    p_roles: filters.roles.length ? filters.roles : null,
    p_eras: filters.eras.length ? filters.eras : null,
    p_limit: PINNED_LIMIT,
  });
  if (error) {
    console.error("pinned_memories", error);
    return [];
  }
  const rows = (data ?? []) as Array<{
    id: string;
    title: string;
    excerpt: string | null;
    cover_path: string | null;
    era: number | null;
    published_at: string | null;
    pinned_at: string | null;
    author_id: string;
    author_full_name: string | null;
    author_slug: string | null;
    author_avatar_path: string | null;
    author_class_year: number | null;
    author_role: FeedRole | null;
  }>;
  const avatarMap = await signedAvatarUrls(
    supabase,
    rows.map((r) => r.author_avatar_path),
  );
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    excerpt: r.excerpt,
    cover_path: r.cover_path,
    era: r.era,
    published_at: r.published_at,
    pinned_at: r.pinned_at,
    cover_url: r.cover_path ? coverUrl(r.cover_path) : null,
    author: {
      id: r.author_id,
      full_name: r.author_full_name,
      slug: r.author_slug,
      avatar_path: r.author_avatar_path,
      class_year: r.author_class_year,
      role: r.author_role,
      avatar_url: r.author_avatar_path ? (avatarMap.get(r.author_avatar_path) ?? null) : null,
    },
  }));
}
