"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type MemoryEditInput = {
  title: string;
  excerpt: string;
  era: number | null;
  body: object;
  publish: boolean;
};

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
    .select("id, author_id, status, published_at")
    .eq("id", id)
    .maybeSingle();
  if (loadErr || !existing) return { ok: false as const, error: "Memory not found." };
  if (existing.author_id !== user.id)
    return { ok: false as const, error: "You can only edit your own memories." };

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
      body: input.body,
      status,
      published_at,
    })
    .eq("id", id);

  if (error) return { ok: false as const, error: error.message };

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
    .select("id, author_id")
    .eq("id", id)
    .maybeSingle();
  if (!existing) return { ok: false as const, error: "Memory not found." };
  if (existing.author_id !== user.id)
    return { ok: false as const, error: "You can only delete your own memories." };

  const { error } = await supabase.from("memories").delete().eq("id", id);
  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/memories");
  return { ok: true as const };
}
