"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildSlug } from "@/lib/auth/slug";
import { nextStepPath, type OnboardingStep } from "@/lib/auth/profile";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

async function ensureUniqueSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  base: string,
  selfId: string,
): Promise<string> {
  let slug = base;
  let n = 2;
  while (true) {
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("slug", slug)
      .neq("id", selfId)
      .maybeSingle();
    if (!data) return slug;
    slug = `${base}-${n++}`;
  }
}

export async function saveClass(formData: FormData) {
  const { supabase, user } = await requireUser();
  const classYear = Number(formData.get("class_year"));
  if (!Number.isInteger(classYear) || classYear < 1980 || classYear > 2100) {
    redirect("/onboarding/class?error=invalid_year");
  }
  await supabase.from("profiles").update({ class_year: classYear }).eq("id", user.id);
  redirect(nextStepPath("class" as OnboardingStep));
}

export async function saveIdentity(formData: FormData) {
  const { supabase, user } = await requireUser();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const major = String(formData.get("major") ?? "").trim();
  if (!fullName || !major) {
    redirect("/onboarding/identity?error=required");
  }

  const { data: current } = await supabase
    .from("profiles")
    .select("class_year")
    .eq("id", user.id)
    .single();

  const baseSlug = buildSlug(fullName, current?.class_year ?? 0);
  const slug = await ensureUniqueSlug(supabase, baseSlug, user.id);

  await supabase.from("profiles").update({ full_name: fullName, major, slug }).eq("id", user.id);

  redirect(nextStepPath("identity"));
}

export async function saveAvatar(formData: FormData) {
  const { supabase, user } = await requireUser();
  const file = formData.get("avatar") as File | null;
  const skip = formData.get("skip") === "1";

  if (!skip && file && file.size > 0) {
    if (!file.type.startsWith("image/")) {
      redirect("/onboarding/avatar?error=not_image");
    }
    if (file.size > 5 * 1024 * 1024) {
      redirect("/onboarding/avatar?error=too_large");
    }
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type,
    });
    if (upErr) {
      redirect("/onboarding/avatar?error=upload_failed");
    }
    await supabase.from("profiles").update({ avatar_path: path }).eq("id", user.id);
  }

  redirect(nextStepPath("avatar"));
}

export async function saveBio(formData: FormData) {
  const { supabase, user } = await requireUser();
  const bio = String(formData.get("bio") ?? "").trim();
  const skip = formData.get("skip") === "1";

  await supabase
    .from("profiles")
    .update({
      bio: skip || !bio ? null : bio.slice(0, 1000),
      onboarded_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  redirect("/profile/me");
}
