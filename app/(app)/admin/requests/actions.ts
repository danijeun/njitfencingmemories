"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getProfile, getSessionUser } from "@/lib/auth/profile";
import { sendApprovedEmail, sendDeclinedEmail } from "@/lib/email/send";

export type ActionResult = { ok: true } | { ok: false; error: string };

const approveSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(["athlete", "alumni", "coach"]),
  class_year: z.coerce.number().int().min(1980).max(2100),
});

const declineSchema = z.object({
  id: z.string().uuid(),
});

async function assertAdmin(): Promise<ActionResult | null> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in" };
  const profile = await getProfile(user.id);
  if (!profile?.is_admin) return { ok: false, error: "Not authorized" };
  return null;
}

export async function approveRequest(formData: FormData): Promise<ActionResult> {
  const denied = await assertAdmin();
  if (denied) return denied;

  const parsed = approveSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();

  const { data: req, error: fetchErr } = await supabase
    .from("access_requests")
    .select("email, full_name, status")
    .eq("id", parsed.data.id)
    .single();
  if (fetchErr || !req) return { ok: false, error: "Request not found" };
  if (req.status !== "pending") return { ok: false, error: "Already decided" };

  const { error } = await supabase.rpc("approve_access_request", {
    p_id: parsed.data.id,
    p_role: parsed.data.role,
    p_class_year: parsed.data.class_year,
  });
  if (error) return { ok: false, error: error.message };

  await sendApprovedEmail(req.email as string, req.full_name as string);

  revalidatePath("/admin/requests");
  revalidatePath("/admin/roster");
  return { ok: true };
}

export async function declineRequest(formData: FormData): Promise<ActionResult> {
  const denied = await assertAdmin();
  if (denied) return denied;

  const parsed = declineSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const supabase = await createClient();
  const { data: req, error: fetchErr } = await supabase
    .from("access_requests")
    .select("email, full_name, status")
    .eq("id", parsed.data.id)
    .single();
  if (fetchErr || !req) return { ok: false, error: "Request not found" };
  if (req.status !== "pending") return { ok: false, error: "Already decided" };

  const user = await getSessionUser();
  const { error } = await supabase
    .from("access_requests")
    .update({
      status: "declined",
      decided_at: new Date().toISOString(),
      decided_by: user!.id,
    })
    .eq("id", parsed.data.id);
  if (error) return { ok: false, error: error.message };

  await sendDeclinedEmail(req.email as string, req.full_name as string);

  revalidatePath("/admin/requests");
  return { ok: true };
}
