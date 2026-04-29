"use client";

import { m, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type MemorySummary = {
  id: string;
  title: string;
  excerpt: string | null;
  cover_path: string | null;
  era: number | null;
  published_at: string | null;
};

export function MemoryCard({ memory, index = 0 }: { memory: MemorySummary; index?: number }) {
  const reduce = useReducedMotion();
  return (
    <m.article
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1], delay: Math.min(index * 0.04, 0.4) }}
      whileHover={reduce ? undefined : { y: -2 }}
      className={cn(
        "@container group rounded-lg border border-[color:var(--color-rule)] bg-[color:var(--color-paper)] p-4 transition-colors hover:border-[color:var(--color-ink)] @md:p-6",
      )}
    >
      {memory.cover_path ? (
        <div className="mb-4 aspect-[4/3] overflow-hidden rounded bg-[color:var(--color-rule)] @md:aspect-[3/2]" />
      ) : null}

      <div className="flex items-baseline justify-between gap-3 font-mono text-[10px] uppercase tracking-widest text-[color:var(--color-body)]">
        <span>{memory.era ?? ""}</span>
        <time dateTime={memory.published_at ?? undefined}>
          {memory.published_at ? new Date(memory.published_at).getFullYear() : ""}
        </time>
      </div>

      <h2 className="mt-2 font-display text-fluid-xl leading-tight text-[color:var(--color-ink)]">
        {memory.title}
      </h2>

      {memory.excerpt ? (
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-[color:var(--color-body)] @md:line-clamp-4 @md:text-base">
          {memory.excerpt}
        </p>
      ) : null}
    </m.article>
  );
}
