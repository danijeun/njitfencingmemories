import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/nav/MobileNav";

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

  const links = user
    ? [
        { href: "/memories", label: "Memories" },
        { href: profileHref, label: "Profile" },
      ]
    : [];

  return (
    <header className="sticky top-0 z-40 border-b border-[color:var(--color-ink)]/10 bg-[color:var(--color-paper)]/85 backdrop-blur supports-[backdrop-filter]:bg-[color:var(--color-paper)]/70 pt-safe">
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

        {user ? (
          <>
            <div className="hidden items-center gap-2 md:flex">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="rounded px-2 py-1 font-mono text-xs uppercase tracking-widest text-[color:var(--color-ink)] hover:opacity-70"
                >
                  {l.label}
                </Link>
              ))}
              <form action={signOut}>
                <Button type="submit" variant="ghost" size="sm">
                  Sign out
                </Button>
              </form>
            </div>
            <MobileNav links={links} signOutAction={signOut} />
          </>
        ) : (
          <Button asChild size="sm">
            <Link href="/login">Log in</Link>
          </Button>
        )}
      </nav>
    </header>
  );
}
