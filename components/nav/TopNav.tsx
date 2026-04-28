import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";

export async function TopNav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profileHref = "/profile/me";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("slug, onboarded_at")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.slug && profile.onboarded_at) {
      profileHref = `/profile/${profile.slug}`;
    } else if (profile && !profile.onboarded_at) {
      profileHref = "/onboarding/class";
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[color:var(--color-ink)]/10 bg-[color:var(--color-paper)]/85 backdrop-blur supports-[backdrop-filter]:bg-[color:var(--color-paper)]/70">
      <nav
        aria-label="Primary"
        className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-10"
      >
        <Link
          href="/"
          className="font-mono text-xs uppercase tracking-widest text-[color:var(--color-ink)]"
        >
          NJIT Fencing
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          {user ? (
            <>
              <Link
                href="/memories"
                className="rounded px-2 py-1 font-mono text-xs uppercase tracking-widest text-[color:var(--color-ink)] hover:opacity-70"
              >
                Memories
              </Link>
              <Link
                href={profileHref}
                className="rounded px-2 py-1 font-mono text-xs uppercase tracking-widest text-[color:var(--color-ink)] hover:opacity-70"
              >
                Profile
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="rounded px-2 py-1 font-mono text-xs uppercase tracking-widest text-[color:var(--color-body)] hover:opacity-70"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="inline-flex min-h-9 items-center justify-center rounded-full bg-[color:var(--color-ink)] px-4 font-mono text-xs uppercase tracking-widest text-[color:var(--color-paper)] hover:opacity-90"
            >
              Log in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
