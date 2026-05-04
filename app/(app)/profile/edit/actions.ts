"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildSlug } from "@/lib/auth/slug";

export async function saveProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const fullName = String(formData.get("full_name") ?? "").trim();
  const major = String(formData.get("major") ?? "").trim();
  const classYear = Number(formData.get("class_year"));
  const bio = String(formData.get("bio") ?? "").trim();
  const file = formData.get("avatar") as File | null;

  if (!fullName || !major || !Number.isInteger(classYear)) {
    redirect("/profile/edit?error=required");
  }

  const update: Record<string, unknown> = {
    full_name: fullName,
    major,
    class_year: classYear,
    bio: bio ? bio.slice(0, 1000) : null,
  };

  if (file && file.size > 0) {
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      redirect("/profile/edit?error=bad_avatar");
    }
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type,
    });
    if (upErr) redirect("/profile/edit?error=upload_failed");
    update.avatar_path = path;
  }

  const baseSlug = buildSlug(fullName, classYear);
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("slug", baseSlug)
    .neq("id", user.id)
    .maybeSingle();
  update.slug = existing ? `${baseSlug}-${user.id.slice(0, 4)}` : baseSlug;

  await supabase.from("profiles").update(update).eq("id", user.id);
  redirect("/profile/me");
}
