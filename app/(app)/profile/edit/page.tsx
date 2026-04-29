import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { EditProfileForm } from "./EditProfileForm";

export default async function EditProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, major, class_year, bio")
    .eq("id", user.id)
    .single();

  return (
    <main className="flex flex-1 justify-center px-6 py-12 sm:py-16">
      <div className="w-full max-w-md">
        <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--color-ink)]">
          Account
        </p>
        <h1 className="mt-3 font-display text-fluid-2xl text-[color:var(--color-ink)]">
          Edit profile
        </h1>
        <Suspense>
          <EditProfileForm
            defaults={{
              full_name: profile?.full_name ?? "",
              class_year: profile?.class_year ?? undefined,
              major: profile?.major ?? "",
              bio: profile?.bio ?? "",
            }}
          />
        </Suspense>
      </div>
    </main>
  );
}
