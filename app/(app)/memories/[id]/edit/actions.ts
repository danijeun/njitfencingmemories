"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sanitizeMemoryBody } from "@/lib/memories/sanitize-body";
import {
  diffPathsToRemove,
  inlineStoragePaths,
  type StoragePath,
} from "@/lib/memories/storage-paths";
import type { SupabaseClient } from "@supabase/supabase-js";

export type MemoryEditInput = {
  title: string;
  excerpt: string;
  era: number | null;
  body: object;
  cover_path: string | null;
  publish: boolean;
};

async function removePaths(supabase: SupabaseClient, paths: StoragePath[]) {
  const grouped = new Map<string, string[]>();
  for (const p of paths) {
    const arr = grouped.get(p.bucket) ?? [];
    arr.push(p.path);
    grouped.set(p.bucket, arr);
  }
  await Promise.all(
    Array.from(grouped.entries()).map(([bucket, list]) =>
      supabase.storage.from(bucket).remove(list),
    ),
  );
}

export async function updateMemory(id: string, input: MemoryEditInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const title = input.title.trim().slice(0, 200);
  const excerpt = input.excerpt.trim().slice(0, 280);
  if (!title) return { ok: false as const, error: "Title is required." };

  const { data: existing, error: loadErr } = await supabase
    .from("memories")
    .select("id, author_id, status, published_at, body, cover_path")
    .eq("id", id)
    .maybeSingle();
  if (loadErr || !existing) return { ok: false as const, error: "Memory not found." };
  if (existing.author_id !== user.id)
    return { ok: false as const, error: "You can only edit your own memories." };

  const body = sanitizeMemoryBody(input.body);

  const status = input.publish ? "published" : "draft";
  const published_at =
    input.publish && existing.status !== "published"
      ? new Date().toISOString()
      : input.publish
        ? existing.published_at
        : null;

  const { error } = await supabase
    .from("memories")
    .update({
      title,
      excerpt: excerpt || null,
      era: input.era,
      body,
      cover_path: input.cover_path,
      status,
      published_at,
    })
    .eq("id", id);

  if (error) return { ok: false as const, error: error.message };

  // Orphan cleanup: inline images removed from body, and replaced cover.
  const orphans: StoragePath[] = diffPathsToRemove(
    inlineStoragePaths(existing.body),
    inlineStoragePaths(body),
  );
  if (existing.cover_path && existing.cover_path !== input.cover_path) {
    orphans.push({ bucket: "memory-covers", path: existing.cover_path });
  }
  if (orphans.length > 0) await removePaths(supabase, orphans);

  revalidatePath("/memories");
  revalidatePath(`/memories/${id}`);
  return { ok: true as const, id, status };
}

export async function deleteMemory(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: existing } = await supabase
    .from("memories")
    .select("id, author_id, body, cover_path")
    .eq("id", id)
    .maybeSingle();
  if (!existing) return { ok: false as const, error: "Memory not found." };
  if (existing.author_id !== user.id)
    return { ok: false as const, error: "You can only delete your own memories." };

  const { error } = await supabase.from("memories").delete().eq("id", id);
  if (error) return { ok: false as const, error: error.message };

  const orphans: StoragePath[] = inlineStoragePaths(existing.body);
  if (existing.cover_path) {
    orphans.push({ bucket: "memory-covers", path: existing.cover_path });
  }
  if (orphans.length > 0) await removePaths(supabase, orphans);

  revalidatePath("/memories");
  return { ok: true as const };
}
