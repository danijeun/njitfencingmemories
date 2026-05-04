import { FeedList } from "@/components/memory/FeedList";
import { fetchFeedPage, fetchPinnedMemories, type FeedFilters } from "./feed";

export async function FeedSection({
  filters,
  isAdmin,
  isAuthed,
}: {
  filters: FeedFilters;
  isAdmin: boolean;
  isAuthed: boolean;
}) {
  const pinned = await fetchPinnedMemories(filters);
  const excludeIds = pinned.map((p) => p.id);
  const firstPage = await fetchFeedPage(filters, null, excludeIds);
  return (
    <FeedList
      pinned={pinned}
      initialItems={firstPage.items}
      initialCursor={firstPage.nextCursor}
      filters={filters}
      isAdmin={isAdmin}
      isAuthed={isAuthed}
    />
  );
}
