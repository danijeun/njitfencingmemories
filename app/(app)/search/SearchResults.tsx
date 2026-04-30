import { Link } from "next-view-transitions";
import { createClient } from "@/lib/supabase/server";
import { MemoryCard } from "@/components/memory/MemoryCard";

type PublicProfile = {
  id: string;
  full_name: string | null;
  slug: string | null;
  avatar_path: string | null;
  class_year: number | null;
  role: string | null;
};

type MemoryRow = {
  id: string;
  title: string;
  excerpt: string | null;
  cover_path: string | null;
  era: number | null;
  published_at: string | null;
  author_id: string;
  status: "draft" | "published";
};

export async function SearchResults({ q }: { q: string }) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_memories", { q, lim: 50 });

  if (error) {
    return (
      <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--color-oxblood)]">
        Search failed. Try a different query.
      </p>
    );
  }

  const memories = (data ?? []) as MemoryRow[];
  const authors = new Map<string, PublicProfile>();
  const ids = Array.from(new Set(memories.map((m) => m.author_id))).filter(Boolean);
  if (ids.length) {
    const { data: profs } = await supabase.rpc("get_public_profiles", { p_ids: ids });
    for (const p of (profs ?? []) as PublicProfile[]) authors.set(p.id, p);
  }

  if (memories.length === 0) {
    return (
      <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--color-body)]">
        No matches for &ldquo;{q}&rdquo;. Try fewer or different words.
      </p>
    );
  }

  return (
    <>
      <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--color-body)]">
        {memories.length} {memories.length === 1 ? "memory" : "memories"} for &ldquo;{q}&rdquo;
        {memories.length === 50 ? " · showing top 50" : ""}
      </p>
      <ul className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {memories.map((m, i) => {
          const author = authors.get(m.author_id);
          return (
            <li key={m.id}>
              <Link href={`/memories/${m.id}`} className="block">
                <MemoryCard memory={m} index={i} />
              </Link>
              <div className="mt-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-[color:var(--color-body)]">
                <span>
                  {author?.full_name ?? "Unknown"}
                  {author?.class_year ? ` · ’${String(author.class_year).slice(-2)}` : ""}
                </span>
                {m.status === "draft" ? (
                  <span className="rounded border border-[color:var(--color-rule)] px-1.5 py-0.5 text-[color:var(--color-oxblood)]">
                    Draft
                  </span>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
