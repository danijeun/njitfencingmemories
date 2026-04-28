import Link from "next/link";

export default function NotOnRosterPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--color-ink)]">
          Access
        </p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-[color:var(--color-ink)]">
          You&apos;re not on the roster yet.
        </h1>
        <p className="mt-4 text-[color:var(--color-body)]">
          This archive is open to current NJIT fencing athletes and alumni only. If you should be on
          the list, ping the captain to be added.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block rounded border border-[color:var(--color-ink)]/30 px-4 py-2"
        >
          Back home
        </Link>
      </div>
    </main>
  );
}
