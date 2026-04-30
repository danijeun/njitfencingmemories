"use server";

import { fetchFeedPage, type FeedCursor, type FeedFilters, type FeedPage } from "./feed";

export async function loadMemoriesPage(
  filters: FeedFilters,
  cursor: FeedCursor,
): Promise<FeedPage> {
  return fetchFeedPage(filters, cursor);
}
