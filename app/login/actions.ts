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

  const h = await headers();
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? h.get("origin") ?? `https://${h.get("host")}`;

  const { data: onRoster } = await supabase.rpc("is_email_on_roster", { p_email: email });

  if (!onRoster) {
    // Don't reveal roster membership. Show the same "sent" confirmation
    // and skip the actual email send.
    redirect(`/login?sent=1&from=${encodeURIComponent(from)}`);
  }

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

export async function signInWithGoogle(formData: FormData) {
  const from = String(formData.get("from") ?? "/profile/me");
  const supabase = await createClient();
  const h = await headers();
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? h.get("origin") ?? `https://${h.get("host")}`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?from=${encodeURIComponent(from)}`,
      queryParams: { access_type: "offline", prompt: "select_account" },
    },
  });

  if (error || !data?.url) {
    redirect(`/login?error=oauth_failed&from=${encodeURIComponent(from)}`);
  }

  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
