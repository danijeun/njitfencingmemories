import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MemoryCard } from "@/components/memory/MemoryCard";
import { MemoryFab } from "@/components/memory/MemoryFab";

export const dynamic = "force-dynamic";

export default async function MemoriesPage() {
  const supabase = await createClient();
  const { data: memories } = await supabase
    .from("memories")
    .select("id, title, excerpt, cover_path, era, published_at, author_id")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(40);

  return (
    <main className="flex-1 px-4 py-10 sm:px-6 lg:px-10">
      <header className="mx-auto max-w-7xl">
        <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--color-ink)]">
          The archive
        </p>
        <h1 className="mt-3 font-display text-4xl leading-[1.05] text-[color:var(--color-ink)] sm:text-5xl">
          Memories
        </h1>
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
            No memories yet. Be the first to add one.
          </p>
        ) : null}
      </section>
      <MemoryFab />
    </main>
  );
}
