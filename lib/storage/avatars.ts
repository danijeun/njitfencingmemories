import type { SupabaseClient } from "@supabase/supabase-js";

export async function signedAvatarUrls(
  supabase: SupabaseClient,
  paths: (string | null | undefined)[],
  ttlSeconds = 60 * 60,
): Promise<Map<string, string>> {
  const unique = Array.from(new Set(paths.filter((p): p is string => Boolean(p))));
  const out = new Map<string, string>();
  if (unique.length === 0) return out;

  const { data, error } = await supabase.storage
    .from("avatars")
    .createSignedUrls(unique, ttlSeconds);
  if (error || !data) return out;

  for (const row of data) {
    if (row.path && row.signedUrl) out.set(row.path, row.signedUrl);
  }
  return out;
}
