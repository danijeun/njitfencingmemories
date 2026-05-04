"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
  full_name: z.string().trim().min(1).max(120),
});

export type RequestResult =
  | { ok: true }
  | { ok: false; error: string; code?: "alreadyApproved" | "invalid" | "db" };

export async function submitAccessRequest(formData: FormData): Promise<RequestResult> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      code: "invalid",
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const supabase = await createClient();

  const { data: onRoster } = await supabase.rpc("is_email_on_roster", {
    p_email: parsed.data.email,
  });
  if (onRoster) {
    return {
      ok: false,
      code: "alreadyApproved",
      error: "This email is already approved. Sign in with the same address.",
    };
  }

  const { error } = await supabase.from("access_requests").insert({
    email: parsed.data.email,
    full_name: parsed.data.full_name,
  });
  if (error) return { ok: false, code: "db", error: error.message };

  return { ok: true };
}
