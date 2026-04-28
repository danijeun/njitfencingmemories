import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { saveProfile } from "./actions";

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
        <h1 className="font-display text-3xl text-[color:var(--color-ink)]">Edit profile</h1>
        <form
          action={saveProfile}
          encType="multipart/form-data"
          className="mt-6 flex flex-col gap-3"
        >
          <label className="text-sm" htmlFor="full_name">
            Full name
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            required
            defaultValue={profile?.full_name ?? ""}
            className="rounded border border-[color:var(--color-ink)]/30 bg-[color:var(--color-paper)] px-3 py-2"
          />
          <label className="mt-2 text-sm" htmlFor="class_year">
            Class year
          </label>
          <input
            id="class_year"
            name="class_year"
            type="number"
            min={1980}
            max={2100}
            required
            defaultValue={profile?.class_year ?? ""}
            className="rounded border border-[color:var(--color-ink)]/30 bg-[color:var(--color-paper)] px-3 py-2"
          />
          <label className="mt-2 text-sm" htmlFor="major">
            Major
          </label>
          <input
            id="major"
            name="major"
            type="text"
            required
            defaultValue={profile?.major ?? ""}
            className="rounded border border-[color:var(--color-ink)]/30 bg-[color:var(--color-paper)] px-3 py-2"
          />
          <label className="mt-2 text-sm" htmlFor="bio">
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={5}
            maxLength={1000}
            defaultValue={profile?.bio ?? ""}
            className="rounded border border-[color:var(--color-ink)]/30 bg-[color:var(--color-paper)] px-3 py-2"
          />
          <label className="mt-2 text-sm" htmlFor="avatar">
            Replace avatar
          </label>
          <input id="avatar" name="avatar" type="file" accept="image/*" className="text-sm" />
          <button
            type="submit"
            className="mt-4 rounded bg-[color:var(--color-ink)] px-4 py-3 text-base font-medium text-[color:var(--color-ivory)]"
          >
            Save
          </button>
        </form>
      </div>
    </main>
  );
}
