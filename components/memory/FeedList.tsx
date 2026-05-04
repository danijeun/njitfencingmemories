"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { loadMemoriesPage } from "@/app/(app)/memories/actions";
import type { FeedCursor, FeedFilters, FeedItem } from "@/app/(app)/memories/feed";
import { FeedCard } from "./FeedCard";
import { FeedSkeleton } from "./FeedSkeleton";

export function FeedList({
  pinned,
  initialItems,
  initialCursor,
  filters,
  isAdmin,
}: {
  pinned: FeedItem[];
  initialItems: FeedItem[];
  initialCursor: FeedCursor;
  filters: FeedFilters;
  isAdmin: boolean;
}) {
  const filtersKey = JSON.stringify(filters);
  const excludeIds = pinned.map((p) => p.id);
  const [items, setItems] = useState<FeedItem[]>(initialItems);
  const [cursor, setCursor] = useState<FeedCursor>(initialCursor);
  const [error, setError] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(filtersKey);
  const [isPending, startTransition] = useTransition();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);

  // Reset state when filters change (render-phase pattern).
  if (resetKey !== filtersKey) {
    setResetKey(filtersKey);
    setItems(initialItems);
    setCursor(initialCursor);
    setError(null);
  }

  useEffect(() => {
    loadingRef.current = false;
  }, [resetKey]);

  const loadMore = useCallback(() => {
    if (loadingRef.current || !cursor) return;
    loadingRef.current = true;
    setError(null);
    startTransition(async () => {
      try {
        const page = await loadMemoriesPage(filters, cursor, excludeIds);
        setItems((prev) => {
          const seen = new Set(prev.map((p) => p.id));
          return [...prev, ...page.items.filter((p) => !seen.has(p.id))];
        });
        setCursor(page.nextCursor);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't load more");
      } finally {
        loadingRef.current = false;
      }
    });
    // excludeIds changes only when `pinned` changes (server prop), which already
    // forces a new client tree, so its identity is stable enough to omit here.
  }, [cursor, filters, excludeIds]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !cursor) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) loadMore();
      },
      { rootMargin: "400px 0px" },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [loadMore, cursor]);

  if (items.length === 0 && pinned.length === 0 && !cursor) {
    return (
      <div className="px-6 py-16 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--color-body)]">
          No memories match these filters.
        </p>
      </div>
    );
  }

  return (
    <div>
      {pinned.map((m, i) => (
        <FeedCard key={`pin-${m.id}`} memory={m} priority={i < 2} isAdmin={isAdmin} />
      ))}
      {items.map((m, i) => (
        <FeedCard key={m.id} memory={m} priority={pinned.length === 0 && i < 2} isAdmin={isAdmin} />
      ))}

      {cursor ? (
        <>
          <div ref={sentinelRef} aria-hidden className="h-1" />
          {isPending ? <FeedSkeleton count={2} /> : null}
        </>
      ) : (
        <p className="px-6 py-10 text-center font-mono text-[10px] uppercase tracking-widest text-[color:var(--color-body)]">
          You&rsquo;ve reached the end · NJIT Highlanders
        </p>
      )}

      {error ? (
        <div className="px-6 py-6 text-center">
          <p className="text-sm text-[color:var(--color-brand-red)]">{error}</p>
          <button
            type="button"
            onClick={loadMore}
            className="mt-2 font-mono text-xs uppercase tracking-widest text-[color:var(--color-ink)] underline underline-offset-4"
          >
            Retry
          </button>
        </div>
      ) : null}
    </div>
  );
}
