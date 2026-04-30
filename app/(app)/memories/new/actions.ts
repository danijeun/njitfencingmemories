"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sanitizeMemoryBody } from "@/lib/memories/sanitize-body";

export type MemoryDraftInput = {
  title: string;
  excerpt: string;
  era: number | null;
  body: object;
  cover_path: string | null;
  publish: boolean;
};

export async function createMemory(input: MemoryDraftInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const title = input.title.trim().slice(0, 200);
  const excerpt = input.excerpt.trim().slice(0, 280);
  if (!title) return { ok: false as const, error: "Title is required." };

  const body = sanitizeMemoryBody(input.body);
  const status = input.publish ? "published" : "draft";
  const published_at = input.publish ? new Date().toISOString() : null;

  const { data, error } = await supabase
    .from("memories")
    .insert({
      author_id: user.id,
      title,
      excerpt: excerpt || null,
      era: input.era,
      body,
      cover_path: input.cover_path,
      status,
      published_at,
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false as const, error: error?.message ?? "Insert failed." };

  revalidatePath("/memories");
  return { ok: true as const, id: data.id, status };
}
