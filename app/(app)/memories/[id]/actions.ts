"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { REACTION_EMOJIS } from "@/components/memory/reactions";

type Ok<T = object> = { ok: true } & T;
type Err = { ok: false; error: string };

const addCommentSchema = z.object({
  memoryId: z.string().uuid(),
  body: z.string().trim().min(1).max(2000),
});

export async function addComment(
  input: z.infer<typeof addCommentSchema>,
): Promise<Ok<{ id: string }> | Err> {
  const parsed = addCommentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const { data, error } = await supabase
    .from("memory_comments")
    .insert({
      memory_id: parsed.data.memoryId,
      author_id: user.id,
      body: parsed.data.body,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/memories/${parsed.data.memoryId}`);
  return { ok: true, id: data.id };
}

const deleteCommentSchema = z.object({
  commentId: z.string().uuid(),
  memoryId: z.string().uuid(),
});

export async function deleteComment(input: z.infer<typeof deleteCommentSchema>): Promise<Ok | Err> {
  const parsed = deleteCommentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const { error } = await supabase.from("memory_comments").delete().eq("id", parsed.data.commentId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/memories/${parsed.data.memoryId}`);
  return { ok: true };
}

const hideCommentSchema = z.object({
  commentId: z.string().uuid(),
  memoryId: z.string().uuid(),
  hidden: z.boolean(),
});

export async function hideComment(input: z.infer<typeof hideCommentSchema>): Promise<Ok | Err> {
  const parsed = hideCommentSchema.safeParse(input);
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

  const patch = parsed.data.hidden
    ? { hidden_at: new Date().toISOString(), hidden_by: user.id }
    : { hidden_at: null, hidden_by: null };

  const { error } = await supabase
    .from("memory_comments")
    .update(patch)
    .eq("id", parsed.data.commentId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/memories/${parsed.data.memoryId}`);
  return { ok: true };
}

const toggleReactionSchema = z.object({
  memoryId: z.string().uuid(),
  emoji: z.enum(REACTION_EMOJIS),
});

export async function toggleReaction(
  input: z.infer<typeof toggleReactionSchema>,
): Promise<Ok<{ reacted: boolean }> | Err> {
  const parsed = toggleReactionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const { data: existing, error: selectError } = await supabase
    .from("memory_reactions")
    .select("id")
    .eq("memory_id", parsed.data.memoryId)
    .eq("author_id", user.id)
    .eq("emoji", parsed.data.emoji)
    .maybeSingle();
  if (selectError) return { ok: false, error: selectError.message };

  if (existing) {
    const { error } = await supabase.from("memory_reactions").delete().eq("id", existing.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/memories/${parsed.data.memoryId}`);
    revalidatePath("/memories");
    return { ok: true, reacted: false };
  }

  const { error } = await supabase.from("memory_reactions").insert({
    memory_id: parsed.data.memoryId,
    author_id: user.id,
    emoji: parsed.data.emoji,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/memories/${parsed.data.memoryId}`);
  revalidatePath("/memories");
  return { ok: true, reacted: true };
}

const FLAG_REASONS = ["spam", "harassment", "off-topic", "other"] as const;

const flagMemorySchema = z.object({
  memoryId: z.string().uuid(),
  reason: z.enum(FLAG_REASONS),
  note: z.string().trim().max(1000).optional(),
});

export async function flagMemory(input: z.infer<typeof flagMemorySchema>): Promise<Ok | Err> {
  const parsed = flagMemorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const { error } = await supabase.from("memory_flags").insert({
    memory_id: parsed.data.memoryId,
    reporter_id: user.id,
    reason: parsed.data.reason,
    note: parsed.data.note ? parsed.data.note : null,
  });
  if (error) {
    if (error.code === "23505") return { ok: false, error: "You've already reported this memory." };
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
