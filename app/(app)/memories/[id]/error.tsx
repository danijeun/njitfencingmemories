"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function MemoryDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[memory-detail]", error);
  }, [error]);

  return (
    <main className="flex-1 px-4 py-10 sm:px-6 lg:px-10">
      <article className="mx-auto max-w-2xl">
        <Link
          href="/memories"
          className="font-mono text-xs uppercase tracking-widest text-[color:var(--color-body)] hover:opacity-70"
        >
          ← All memories
        </Link>
        <h1 className="mt-6 font-display text-3xl text-[color:var(--color-ink)]">
          Couldn&apos;t render this memory
        </h1>
        <p className="mt-3 text-sm text-[color:var(--color-body)]">
          Something threw while loading the page. The team has been notified.
        </p>
        <pre className="mt-4 overflow-x-auto rounded-md border border-[color:var(--color-rule)] bg-[color:var(--color-paper)] p-3 font-mono text-xs text-[color:var(--color-body)]">
          {error.message}
          {error.digest ? `\n\ndigest: ${error.digest}` : ""}
        </pre>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-full bg-[color:var(--color-brand-red)] px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-white hover:opacity-90"
          >
            Reload
          </button>
          <Link
            href="/memories"
            className="rounded-full border border-[color:var(--color-rule)] px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-[color:var(--color-body)] hover:border-[color:var(--color-ink)]"
          >
            Back
          </Link>
        </div>
      </article>
    </main>
  );
}
