import { Suspense } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchResultsSkeleton } from "@/components/skeletons/SearchResultsSkeleton";
import { SearchResults } from "./SearchResults";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q: rawQ } = await searchParams;
  const q = (rawQ ?? "").trim().slice(0, 200);

  return (
    <main className="flex-1 px-4 py-10 sm:px-6 lg:px-10">
      <header className="mx-auto max-w-7xl">
        <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--color-ink)]">
          The archive
        </p>
        <h1 className="mt-3 font-display text-4xl leading-[1.05] text-[color:var(--color-ink)] sm:text-5xl">
          Search
        </h1>

        <form
          action="/search"
          method="get"
          role="search"
          className="mt-6 flex max-w-xl items-center gap-2"
        >
          <Input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Try a year, a name, or a phrase…"
            autoFocus={!q}
            aria-label="Search memories"
            className="flex-1"
          />
          <Button type="submit">Search</Button>
        </form>
      </header>

      <section className="mx-auto mt-10 max-w-7xl" aria-live="polite">
        {!q ? (
          <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--color-body)]">
            Type a query to begin.
          </p>
        ) : (
          <Suspense key={q} fallback={<SearchResultsSkeleton count={6} />}>
            <SearchResults q={q} />
          </Suspense>
        )}
      </section>
    </main>
  );
}
