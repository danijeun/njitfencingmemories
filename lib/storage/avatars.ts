import type { SupabaseClient } from "@supabase/supabase-js";
import { avatarUrl } from "./publicUrl";

// The avatars bucket is public-read; we still expose a Map-shaped helper
// because callsites batch-resolve URLs by path.
export async function signedAvatarUrls(
  _supabase: SupabaseClient,
  paths: (string | null | undefined)[],
): Promise<Map<string, string>> {
  const unique = Array.from(new Set(paths.filter((p): p is string => Boolean(p))));
  const out = new Map<string, string>();
  for (const path of unique) out.set(path, avatarUrl(path));
  return out;
}
