"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  PINNED_LIMIT,
  fetchFeedPage,
  type FeedCursor,
  type FeedFilters,
  type FeedPage,
} from "./feed";

export async function loadMemoriesPage(
  filters: FeedFilters,
  cursor: FeedCursor,
  excludeIds: string[] = [],
): Promise<FeedPage> {
  return fetchFeedPage(filters, cursor, excludeIds);
}

const togglePinSchema = z.object({
  memoryId: z.string().uuid(),
  pinned: z.boolean(),
});

export type TogglePinResult = { ok: true } | { ok: false; error: string };

export async function togglePin(input: {
  memoryId: string;
  pinned: boolean;
}): Promise<TogglePinResult> {
  const parsed = togglePinSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.is_admin) return { ok: false, error: "Admins only" };

  if (parsed.data.pinned) {
    const { count, error: countError } = await supabase
      .from("memories")
      .select("id", { count: "exact", head: true })
      .not("pinned_at", "is", null);
    if (countError) return { ok: false, error: countError.message };
    if ((count ?? 0) >= PINNED_LIMIT) {
      return { ok: false, error: `Pin limit reached (${PINNED_LIMIT}). Unpin one first.` };
    }
  }

  const patch = parsed.data.pinned
    ? { pinned_at: new Date().toISOString(), pinned_by: user.id }
    : { pinned_at: null, pinned_by: null };

  const { error } = await supabase.from("memories").update(patch).eq("id", parsed.data.memoryId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/memories");
  revalidatePath(`/memories/${parsed.data.memoryId}`);
  return { ok: true };
}
