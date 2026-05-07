"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getProfile, getSessionUser } from "@/lib/auth/profile";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function assertAdmin(): Promise<ActionResult | null> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in" };
  const profile = await getProfile(user.id);
  if (!profile?.is_admin) return { ok: false, error: "Not authorized" };
  return null;
}

const idSchema = z.object({ id: z.string().uuid() });

export async function softDeleteMemory(formData: FormData): Promise<ActionResult> {
  const denied = await assertAdmin();
  if (denied) return denied;

  const parsed = idSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const supabase = await createClient();
  const user = await getSessionUser();
  const { error } = await supabase
    .from("memories")
    .update({ deleted_at: new Date().toISOString(), deleted_by: user!.id })
    .eq("id", parsed.data.id);
  if (error) return { ok: false, error: error.message };

  // Auto-resolve any open flags on this memory.
  await supabase
    .from("memory_flags")
    .update({ resolved_at: new Date().toISOString(), resolved_by: user!.id })
    .eq("memory_id", parsed.data.id)
    .is("resolved_at", null);

  revalidatePath("/admin/moderation");
  revalidatePath("/memories");
  revalidatePath(`/memories/${parsed.data.id}`);
  return { ok: true };
}

export async function restoreMemory(formData: FormData): Promise<ActionResult> {
  const denied = await assertAdmin();
  if (denied) return denied;

  const parsed = idSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("memories")
    .update({ deleted_at: null, deleted_by: null })
    .eq("id", parsed.data.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/moderation");
  revalidatePath("/memories");
  revalidatePath(`/memories/${parsed.data.id}`);
  return { ok: true };
}

export async function resolveFlag(formData: FormData): Promise<ActionResult> {
  const denied = await assertAdmin();
  if (denied) return denied;

  const parsed = idSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const supabase = await createClient();
  const user = await getSessionUser();
  const { error } = await supabase
    .from("memory_flags")
    .update({ resolved_at: new Date().toISOString(), resolved_by: user!.id })
    .eq("id", parsed.data.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/moderation");
  return { ok: true };
}
