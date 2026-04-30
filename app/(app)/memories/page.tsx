import { Link } from "next-view-transitions";
import { createClient } from "@/lib/supabase/server";
import { MemoryCard } from "@/components/memory/MemoryCard";
import { MemoryFab } from "@/components/memory/MemoryFab";
import { TimelineRail, type EraCount } from "@/components/memory/TimelineRail";
import { FilterSheet } from "@/components/memory/FilterSheet";

export const dynamic = "force-dynamic";

function parseEra(raw: string | undefined): number | null {
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1980 || n > 2100) return null;
  return n;
}

export default async function MemoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ era?: string }>;
}) {
  const { era: rawEra } = await searchParams;
  const era = parseEra(rawEra);

  const supabase = await createClient();

  let memoriesQuery = supabase
    .from("memories")
    .select("id, title, excerpt, cover_path, era, published_at, author_id")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(40);
  if (era !== null) memoriesQuery = memoriesQuery.eq("era", era);

  const [{ data: memories }, { data: eraRows }, userResult] = await Promise.all([
    memoriesQuery,
    supabase.rpc("memory_era_counts"),
    supabase.auth.getUser(),
  ]);
  const isAuthed = Boolean(userResult.data.user);
  const eras = (eraRows ?? []) as EraCount[];

  return (
    <main className="flex-1 px-4 py-10 sm:px-6 lg:px-10">
      <header className="mx-auto max-w-7xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--color-ink)]">
              The archive
            </p>
            <h1 className="mt-3 font-display text-4xl leading-[1.05] text-[color:var(--color-ink)] sm:text-5xl">
              Memories
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {isAuthed ? (
              <Link
                href="/memories/drafts"
                className="font-mono text-xs uppercase tracking-widest text-[color:var(--color-body)] hover:text-[color:var(--color-brand-red)]"
              >
                Drafts
              </Link>
            ) : null}
            <FilterSheet eras={eras} active={era} />
          </div>
        </div>

        {era !== null ? (
          <p className="mt-4 flex items-center gap-3 font-mono text-[11px] uppercase tracking-widest text-[color:var(--color-body)]">
            <span className="rounded-full bg-[color:var(--color-oxblood)] px-2 py-0.5 text-[color:var(--color-brand-white)]">
              Era · {era}
            </span>
            <Link
              href="/memories"
              className="underline decoration-[color:var(--color-rule)] underline-offset-4 hover:text-[color:var(--color-oxblood)]"
            >
              Clear
            </Link>
          </p>
        ) : null}

        <div className="mt-6 hidden md:block">
          <TimelineRail eras={eras} active={era} orientation="horizontal" />
        </div>
      </header>

      <section
        className="mx-auto mt-10 max-w-7xl columns-1 gap-6 sm:columns-2 lg:columns-3 2xl:columns-4 [&>*]:mb-6 [&>*]:break-inside-avoid"
        aria-label="Memory feed"
      >
        {(memories ?? []).map((m, i) => (
          <Link key={m.id} href={`/memories/${m.id}`} className="block">
            <MemoryCard memory={m} index={i} />
          </Link>
        ))}
        {(memories ?? []).length === 0 ? (
          <p className="font-mono text-xs text-[color:var(--color-body)]">
            {era !== null
              ? `No memories published for ${era} yet.`
              : "No memories yet. Be the first to add one."}
          </p>
        ) : null}
      </section>
      {isAuthed ? <MemoryFab /> : null}
    </main>
  );
}
