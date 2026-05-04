import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let onboarded = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarded_at")
      .eq("id", user.id)
      .maybeSingle();
    onboarded = Boolean(profile?.onboarded_at);
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="max-w-2xl">
        {/* proposed copy — eyebrow draws on Highlanders heritage frame, flagged for human review */}
        <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--color-oxblood)]">
          NJIT Highlanders &middot; Fencing
        </p>
        <h1 className="mt-4 font-display text-5xl leading-[1.05] text-[color:var(--color-ink)] sm:text-6xl">
          Your years at NJIT, in your words.
        </h1>
        <div aria-hidden className="njit-tartan-rule mt-6 max-w-24" />
        <p className="mt-6 max-w-xl text-lg leading-8 text-[color:var(--color-body)]">
          An archive of the team, by the team. Meets, training, road trips, coaches, teammates. Add
          yours when we open submissions.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          {!user ? (
            <>
              <Link
                href="/memories"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-[color:var(--color-oxblood)] px-6 font-mono text-xs uppercase tracking-widest text-[color:var(--color-brand-white)] transition hover:opacity-90"
              >
                Browse memories
              </Link>
              <Link
                href="/login"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--color-ink)]/30 px-6 font-mono text-xs uppercase tracking-widest text-[color:var(--color-ink)] transition hover:opacity-70"
              >
                Log in
              </Link>
            </>
          ) : !onboarded ? (
            <Link
              href="/onboarding/class"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[color:var(--color-oxblood)] px-6 font-mono text-xs uppercase tracking-widest text-[color:var(--color-brand-white)] transition hover:opacity-90"
            >
              Finish onboarding
            </Link>
          ) : (
            <>
              <Link
                href="/memories"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-[color:var(--color-oxblood)] px-6 font-mono text-xs uppercase tracking-widest text-[color:var(--color-brand-white)] transition hover:opacity-90"
              >
                Browse memories
              </Link>
              <Link
                href="/profile/me"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--color-ink)]/30 px-6 font-mono text-xs uppercase tracking-widest text-[color:var(--color-ink)] transition hover:opacity-70"
              >
                My profile
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
