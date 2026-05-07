import type { SupabaseClient } from "@supabase/supabase-js";

export async function ensureUniqueSlug(
  supabase: SupabaseClient,
  base: string,
  selfId: string,
): Promise<string> {
  let slug = base;
  let n = 2;
  while (true) {
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("slug", slug)
      .neq("id", selfId)
      .maybeSingle();
    if (!data) return slug;
    slug = `${base}-${n++}`;
  }
}

export function buildSlug(fullName: string, classYear: number): string {
  const base = fullName
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base}-${classYear}`;
}
