import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function MyProfileRedirect() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("slug")
    .eq("id", user.id)
    .single();

  if (!profile?.slug) redirect("/onboarding/class");
  redirect(`/profile/${profile.slug}`);
}
