import { sendMagicLink, signInWithGoogle } from "./actions";

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
          <>
            <form action={signInWithGoogle} className="mt-8">
              <input type="hidden" name="from" value={from} />
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-3 rounded border border-[color:var(--color-ink)]/30 bg-[color:var(--color-brand-white)] px-4 py-3 text-base font-medium text-[color:var(--color-ink)] transition hover:bg-[color:var(--color-paper)]"
              >
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18">
                  <path
                    fill="#4285F4"
                    d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
                  />
                  <path
                    fill="#34A853"
                    d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"
                  />
                  <path
                    fill="#EA4335"
                    d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"
                  />
                </svg>
                Continue with Google
              </button>
              {error === "oauth_failed" && (
                <p className="mt-2 text-sm text-[color:var(--color-oxblood)]">
                  Could not start Google sign-in. Try again.
                </p>
              )}
            </form>

            <div className="mt-6 flex items-center gap-3 text-xs uppercase tracking-widest text-[color:var(--color-body)]">
              <span className="h-px flex-1 bg-[color:var(--color-ink)]/15" />
              or use email
              <span className="h-px flex-1 bg-[color:var(--color-ink)]/15" />
            </div>

          <form action={sendMagicLink} className="mt-6 flex flex-col gap-3">
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
              className="mt-2 rounded border border-[color:var(--color-ink)]/30 bg-[color:var(--color-paper)] px-4 py-3 text-base font-medium text-[color:var(--color-ink)] transition hover:bg-[color:var(--color-ink)]/5"
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
          </>
        )}
      </div>
    </main>
  );
}
