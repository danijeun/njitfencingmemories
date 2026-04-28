import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="max-w-2xl">
        <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--color-ink)]">
          NJIT Fencing
        </p>
        <h1 className="mt-4 font-display text-5xl leading-[1.05] text-[color:var(--color-ink)] sm:text-6xl">
          An archive of the team, by the team.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-[color:var(--color-body)]">
          Stories from meets, training, road trips, coaches, teammates. Add yours when we open
          submissions.
        </p>
        <Link
          href="/login"
          className="mt-10 inline-flex min-h-11 items-center justify-center rounded-full bg-[color:var(--color-ink)] px-6 font-mono text-xs uppercase tracking-widest text-[color:var(--color-paper)] transition hover:opacity-90"
        >
          Log in
        </Link>
      </div>
    </main>
  );
}
