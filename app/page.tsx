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
        <p className="mt-10 font-mono text-xs text-[color:var(--color-ink)]">Coming soon.</p>
      </div>
    </main>
  );
}
