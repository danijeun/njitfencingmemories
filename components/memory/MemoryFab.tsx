"use client";

import Link from "next/link";
import { PenLine } from "lucide-react";

export function MemoryFab() {
  return (
    <Link
      href="/memories/new"
      aria-label="Write a new memory"
      className="fixed right-4 z-30 inline-flex h-14 items-center justify-center gap-2 rounded-full bg-[color:var(--color-ink)] px-5 font-mono text-xs uppercase tracking-widest text-[color:var(--color-paper)] shadow-lg transition hover:opacity-90 active:scale-[0.98] sm:right-6"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 1.25rem)" }}
    >
      <PenLine className="size-4" />
      <span className="hidden xs:inline">New memory</span>
    </Link>
  );
}
