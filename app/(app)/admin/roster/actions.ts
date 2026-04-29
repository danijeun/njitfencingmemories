"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const roleEnum = z.enum(["athlete", "alumni", "coach"]);

const addSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  role: roleEnum,
  class_year: z.coerce.number().int().min(1980).max(2100),
  full_name: z.string().trim().min(1).max(120),
});

const updateSchema = addSchema.extend({
  original_email: z.string().trim().toLowerCase().email(),
});

const deleteSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function addRosterEntry(formData: FormData): Promise<ActionResult> {
  const parsed = addSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const { error } = await supabase.from("roster").insert(parsed.data);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/roster");
  return { ok: true };
}

export async function updateRosterEntry(formData: FormData): Promise<ActionResult> {
  const parsed = updateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { original_email, ...patch } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("roster").update(patch).eq("email", original_email);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/roster");
  return { ok: true };
}

export async function removeRosterEntry(formData: FormData): Promise<ActionResult> {
  const parsed = deleteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: "Invalid email" };

  const supabase = await createClient();
  const { error } = await supabase.from("roster").delete().eq("email", parsed.data.email);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/roster");
  return { ok: true };
}
