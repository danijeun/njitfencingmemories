"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function sendMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const from = String(formData.get("from") ?? "/profile/me");

  if (!email || !email.includes("@")) {
    redirect(`/login?error=invalid_email&from=${encodeURIComponent(from)}`);
  }

  const supabase = await createClient();

  // Pre-check the roster so we don't email people who can't sign in.
  // Note: the roster table is locked via RLS to anon/authenticated, so this
  // check uses a SECURITY DEFINER RPC. For now we just attempt the OTP send
  // and gate access at /auth/callback — keeps the migration small.

  const h = await headers();
  const origin = h.get("origin") ?? `https://${h.get("host")}`;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?from=${encodeURIComponent(from)}`,
    },
  });

  if (error) {
    redirect(`/login?error=send_failed&from=${encodeURIComponent(from)}`);
  }

  redirect(`/login?sent=1&from=${encodeURIComponent(from)}`);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
