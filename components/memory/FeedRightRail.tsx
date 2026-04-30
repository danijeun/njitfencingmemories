import { Link } from "next-view-transitions";
import { createClient } from "@/lib/supabase/server";
import { signedAvatarUrls } from "@/lib/storage/avatars";
import type { EraCount } from "./TimelineRail";

export async function FeedRightRail({ eras }: { eras: EraCount[] }) {
  const supabase = await createClient();

  // Suggested alumni: most-recent distinct authors of published memories.
  const { data: recent } = await supabase
    .from("memories")
    .select("author_id, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(20);

  const seen = new Set<string>();
  const ids: string[] = [];
  for (const r of recent ?? []) {
    if (!r.author_id || seen.has(r.author_id)) continue;
    seen.add(r.author_id);
    ids.push(r.author_id);
    if (ids.length >= 5) break;
  }

  const { data: profs } = ids.length
    ? await supabase.rpc("get_public_profiles", { p_ids: ids })
    : {
        data: [] as Array<{
          id: string;
          full_name: string | null;
          slug: string | null;
          avatar_path: string | null;
          class_year: number | null;
          role: string | null;
        }>,
      };

  const profiles = (profs ?? []) as Array<{
    id: string;
    full_name: string | null;
    slug: string | null;
    avatar_path: string | null;
    class_year: number | null;
    role: string | null;
  }>;
  const ordered = ids
    .map((id) => profiles.find((p) => p.id === id))
    .filter(Boolean) as typeof profiles;

  const avatars = await signedAvatarUrls(
    supabase,
    ordered.map((p) => p.avatar_path),
  );

  // Top 5 eras by count.
  const topEras = [...eras].sort((a, b) => b.count - a.count).slice(0, 5);

  return (
    <aside className="space-y-6">
      <section className="rounded-2xl border border-[color:var(--color-rule)] bg-[color:var(--color-paper)] p-5">
        <h2 className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--color-body)]">
          Active eras
        </h2>
        <ul className="mt-3 space-y-2">
          {topEras.length === 0 ? (
            <li className="text-xs text-[color:var(--color-body)]">No eras yet.</li>
          ) : (
            topEras.map(({ era, count }) => (
              <li key={era} className="flex items-baseline justify-between gap-2">
                <Link
                  href={`/memories?eras=${era}`}
                  className="font-display text-base text-[color:var(--color-ink)] hover:text-[color:var(--color-brand-red)]"
                >
                  {era}
                </Link>
                <span className="font-mono text-[11px] tabular-nums text-[color:var(--color-body)]">
                  {count}
                </span>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="rounded-2xl border border-[color:var(--color-rule)] bg-[color:var(--color-paper)] p-5">
        <h2 className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--color-body)]">
          Recently active
        </h2>
        <ul className="mt-3 space-y-3">
          {ordered.length === 0 ? (
            <li className="text-xs text-[color:var(--color-body)]">No alumni yet.</li>
          ) : (
            ordered.map((p) => {
              const url = p.avatar_path ? avatars.get(p.avatar_path) : null;
              return (
                <li key={p.id}>
                  <Link
                    href={p.slug ? `/profile/${p.slug}` : "#"}
                    className="flex items-center gap-3 hover:opacity-80"
                  >
                    {url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={url} alt="" className="size-9 shrink-0 rounded-full object-cover" />
                    ) : (
                      <span
                        aria-hidden
                        className="grid size-9 shrink-0 place-items-center rounded-full bg-[color:var(--color-rule)] font-mono text-[10px] uppercase text-[color:var(--color-ink)]"
                      >
                        {(p.full_name ?? "·")[0]}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[color:var(--color-ink)]">
                        {p.full_name ?? "Unknown"}
                      </p>
                      <p className="truncate font-mono text-[10px] uppercase tracking-widest text-[color:var(--color-body)]">
                        {p.role ?? ""}
                        {p.class_year ? ` · ’${String(p.class_year).slice(-2)}` : ""}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })
          )}
        </ul>
      </section>

      <section className="rounded-2xl border border-[color:var(--color-rule)] bg-[color:var(--color-paper)] p-5">
        <h2 className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--color-body)]">
          How to contribute
        </h2>
        <p className="mt-2 text-sm leading-6 text-[color:var(--color-body)]">
          On the roster? Sign in and share a memory — a meet, a teammate, a moment.
        </p>
        <Link
          href="/memories/new"
          className="mt-3 inline-flex font-mono text-[10px] uppercase tracking-widest text-[color:var(--color-brand-red)] underline underline-offset-4"
        >
          Write one →
        </Link>
      </section>
    </aside>
  );
}
