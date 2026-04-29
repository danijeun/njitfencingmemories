import { sendMagicLink } from "./actions";

type SearchParams = Promise<{ sent?: string; error?: string; from?: string }>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const sent = sp.sent === "1";
  const error = sp.error;
  const from = sp.from ?? "/profile/me";

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--color-ink)]">
          NJIT Fencing
        </p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-[color:var(--color-ink)]">
          Sign in
        </h1>
        <p className="mt-3 text-[color:var(--color-body)]">
          Roster only. Use the email the captain has on file.
        </p>

        {sent ? (
          <div className="mt-8 rounded border border-[color:var(--color-ink)]/20 bg-[color:var(--color-paper)] p-4 text-sm">
            Check your inbox for a magic link. It expires in an hour.
          </div>
        ) : (
          <form action={sendMagicLink} className="mt-8 flex flex-col gap-3">
            <label className="text-sm" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="rounded border border-[color:var(--color-ink)]/30 bg-[color:var(--color-paper)] px-3 py-2 text-base"
            />
            <input type="hidden" name="from" value={from} />
            <button
              type="submit"
              className="mt-2 rounded bg-[color:var(--color-oxblood)] px-4 py-3 text-base font-medium text-[color:var(--color-brand-white)] transition hover:opacity-90"
            >
              Send magic link
            </button>
            {error === "invalid_email" && (
              <p className="text-sm text-[color:var(--color-oxblood)]">
                That doesn&apos;t look like a valid email.
              </p>
            )}
            {error === "send_failed" && (
              <p className="text-sm text-[color:var(--color-oxblood)]">
                Could not send the link. Try again in a minute.
              </p>
            )}
          </form>
        )}
      </div>
    </main>
  );
}
