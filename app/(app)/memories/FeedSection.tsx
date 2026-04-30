import { FeedList } from "@/components/memory/FeedList";
import { fetchFeedPage, type FeedFilters } from "./feed";

export async function FeedSection({ filters }: { filters: FeedFilters }) {
  const firstPage = await fetchFeedPage(filters, null);
  return (
    <FeedList
      initialItems={firstPage.items}
      initialCursor={firstPage.nextCursor}
      filters={filters}
    />
  );
}
