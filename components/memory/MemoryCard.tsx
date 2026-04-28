type MemorySummary = {
  id: string;
  title: string;
  excerpt: string | null;
  cover_path: string | null;
  era: number | null;
  published_at: string | null;
};

export function MemoryCard({ memory }: { memory: MemorySummary }) {
  return (
    <article className="@container group rounded-lg border border-[color:var(--color-rule)] bg-[color:var(--color-paper)] p-4 transition hover:border-[color:var(--color-ink)] @md:p-6">
      {memory.cover_path ? (
        <div className="mb-4 aspect-[4/3] overflow-hidden rounded bg-[color:var(--color-rule)] @md:aspect-[3/2]" />
      ) : null}

      <div className="flex items-baseline justify-between gap-3 font-mono text-[10px] uppercase tracking-widest text-[color:var(--color-body)]">
        <span>{memory.era ?? ""}</span>
        <time dateTime={memory.published_at ?? undefined}>
          {memory.published_at ? new Date(memory.published_at).getFullYear() : ""}
        </time>
      </div>

      <h2 className="mt-2 font-display text-xl leading-tight text-[color:var(--color-ink)] @md:text-2xl">
        {memory.title}
      </h2>

      {memory.excerpt ? (
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-[color:var(--color-body)] @md:line-clamp-4 @md:text-base">
          {memory.excerpt}
        </p>
      ) : null}
    </article>
  );
}
