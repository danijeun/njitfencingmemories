import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";

export default async function ProfilePage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, class_year, major, bio, avatar_path, slug")
    .eq("slug", handle)
    .maybeSingle();

  if (!profile) notFound();

  let avatarUrl: string | null = null;
  if (profile.avatar_path) {
    const { data } = await supabase.storage
      .from("avatars")
      .createSignedUrl(profile.avatar_path, 60 * 60);
    avatarUrl = data?.signedUrl ?? null;
  }

  const isMe = user?.id === profile.id;

  return (
    <main className="flex flex-1 justify-center px-6 py-12 sm:py-16">
      <div className="w-full max-w-md">
        <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--color-ink)]">
          {profile.role === "athlete" ? "Athlete" : "Alum"} · Class of {profile.class_year}
        </p>
        <div className="mt-4 flex items-center gap-4">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={profile.full_name}
              className="h-20 w-20 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[color:var(--color-paper)] font-display text-2xl text-[color:var(--color-ink)]">
              {profile.full_name
                .split(" ")
                .map((n: string) => n[0])
                .slice(0, 2)
                .join("")}
            </div>
          )}
          <div>
            <h1 className="font-display text-3xl text-[color:var(--color-ink)]">
              {profile.full_name}
            </h1>
            <p className="text-sm text-[color:var(--color-body)]">{profile.major}</p>
          </div>
        </div>

        {profile.bio && (
          <p className="mt-6 text-[color:var(--color-body)] leading-relaxed">{profile.bio}</p>
        )}

        {isMe && (
          <div className="mt-10 flex items-center gap-3">
            <Link
              href="/profile/edit"
              className="rounded border border-[color:var(--color-ink)]/30 px-3 py-2 text-sm"
            >
              Edit profile
            </Link>
            <form action={signOut}>
              <button type="submit" className="text-sm underline">
                Sign out
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
