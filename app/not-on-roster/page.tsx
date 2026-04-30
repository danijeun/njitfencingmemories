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
          Reading the archive is open to everyone, but publishing memories and creating a profile is
          limited to current NJIT fencing athletes, alumni, and coaches.
        </p>
        <p className="mt-4 text-[color:var(--color-body)]">
          If you should be on the roster, email{" "}
          <a
            href="mailto:danijeun@gmail.com?subject=NJIT%20Fencing%20roster%20request"
            className="underline decoration-[color:var(--color-brand-red)] underline-offset-4"
          >
            danijeun@gmail.com
          </a>{" "}
          to be added. If you signed in with the wrong email (for example a personal Google
          account), try again with the address the captain has on file.
        </p>
        <div className="mt-8 flex gap-3">
          <Link
            href="/login"
            className="inline-block rounded border border-[color:var(--color-ink)]/30 px-4 py-2"
          >
            Try a different email
          </Link>
          <Link
            href="/memories"
            className="inline-block rounded border border-[color:var(--color-ink)]/30 px-4 py-2"
          >
            Browse memories
          </Link>
        </div>
      </div>
    </main>
  );
}
