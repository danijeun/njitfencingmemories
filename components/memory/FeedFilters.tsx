"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useTransition } from "react";
import { cn } from "@/lib/utils";
import { emitNavStart } from "@/components/nav/nav-progress-bus";
import type { EraCount } from "./TimelineRail";
import type { FeedRole, FeedSort } from "@/app/(app)/memories/feed";

const ROLES: { value: FeedRole; label: string }[] = [
  { value: "athlete", label: "Athletes" },
  { value: "alumni", label: "Alumni" },
  { value: "coach", label: "Coaches" },
];

function readArray(sp: URLSearchParams, key: string): string[] {
  const raw = sp.get(key);
  if (!raw) return [];
  return raw.split(",").filter(Boolean);
}

export function useFeedFilterState() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();

  const sort = (sp.get("sort") === "oldest" ? "oldest" : "newest") as FeedSort;
  const roles = readArray(sp, "roles") as FeedRole[];
  const eras = readArray(sp, "eras")
    .map((s) => Number(s))
    .filter((n) => Number.isInteger(n));

  const setParams = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(sp);
      for (const [key, value] of Object.entries(updates)) {
        if (!value) next.delete(key);
        else next.set(key, value);
      }
      const qs = next.toString();
      const url = qs ? `${pathname}?${qs}` : pathname;
      emitNavStart();
      startTransition(() => {
        router.replace(url, { scroll: false });
      });
    },
    [pathname, router, sp],
  );

  const setParam = useCallback(
    (key: string, value: string | null) => setParams({ [key]: value }),
    [setParams],
  );

  return { sort, roles, eras, setParam, setParams };
}

export function FeedTabs() {
  const { sort, setParam } = useFeedFilterState();
  const tab = (value: FeedSort, label: string) => (
    <button
      key={value}
      type="button"
      onClick={() => setParam("sort", value === "newest" ? null : value)}
      aria-pressed={sort === value}
      className={cn(
        "relative flex-1 px-4 py-3 text-sm transition-colors",
        sort === value
          ? "font-semibold text-[color:var(--color-ink)]"
          : "text-[color:var(--color-body)] hover:bg-[color:var(--color-paper)]",
      )}
    >
      {label}
      <span
        aria-hidden
        className={cn(
          "absolute inset-x-6 bottom-0 h-0.5 rounded-full transition-colors",
          sort === value ? "bg-[color:var(--color-brand-red)]" : "bg-transparent",
        )}
      />
    </button>
  );
  return (
    <div className="sticky top-0 z-10 flex border-b border-[color:var(--color-rule)] bg-[color:var(--color-bg,white)]/90 backdrop-blur supports-[backdrop-filter]:bg-[color:var(--color-bg,white)]/70">
      {tab("newest", "Latest")}
      {tab("oldest", "Oldest")}
    </div>
  );
}

export function FeedFiltersPanel({ eras }: { eras: EraCount[] }) {
  const { sort, roles, eras: activeEras, setParam, setParams } = useFeedFilterState();

  const decadeGroups = useMemo(() => {
    const map = new Map<number, EraCount[]>();
    for (const e of eras) {
      const d = Math.floor(e.era / 10) * 10;
      const list = map.get(d) ?? [];
      list.push(e);
      map.set(d, list);
    }
    return Array.from(map.entries())
      .map(([decade, items]) => ({ decade, items: items.sort((a, b) => a.era - b.era) }))
      .sort((a, b) => a.decade - b.decade);
  }, [eras]);

  const toggle = (key: "roles" | "eras", value: string) => {
    const current = key === "roles" ? roles : activeEras.map(String);
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    setParam(key, next.length ? next.join(",") : null);
  };

  const anyActive = sort !== "newest" || roles.length > 0 || activeEras.length > 0;

  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-2 font-mono text-[10px] uppercase tracking-widest text-[color:var(--color-body)]">
          Sort
        </h3>
        <div className="flex gap-2">
          {(["newest", "oldest"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setParam("sort", s === "newest" ? null : s)}
              aria-pressed={sort === s}
              className={cn(
                "rounded-full border px-3 py-1 text-xs capitalize transition-colors",
                sort === s
                  ? "border-[color:var(--color-ink)] bg-[color:var(--color-ink)] text-[color:var(--color-brand-white)]"
                  : "border-[color:var(--color-rule)] text-[color:var(--color-body)] hover:border-[color:var(--color-ink)]",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-2 font-mono text-[10px] uppercase tracking-widest text-[color:var(--color-body)]">
          Role
        </h3>
        <div className="flex flex-wrap gap-2">
          {ROLES.map((r) => {
            const active = roles.includes(r.value);
            return (
              <button
                key={r.value}
                type="button"
                onClick={() => toggle("roles", r.value)}
                aria-pressed={active}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-colors",
                  active
                    ? "border-[color:var(--color-brand-red)] bg-[color:var(--color-brand-red)] text-[color:var(--color-brand-white)]"
                    : "border-[color:var(--color-rule)] text-[color:var(--color-body)] hover:border-[color:var(--color-ink)]",
                )}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="mb-2 font-mono text-[10px] uppercase tracking-widest text-[color:var(--color-body)]">
          Era
        </h3>
        {decadeGroups.length === 0 ? (
          <p className="font-mono text-[11px] text-[color:var(--color-body)]">No eras yet.</p>
        ) : (
          <div className="space-y-3">
            {decadeGroups.map(({ decade, items }) => (
              <div key={decade}>
                <p className="mb-1 font-display text-sm text-[color:var(--color-ink)]">{decade}s</p>
                <div className="flex flex-wrap gap-1.5">
                  {items.map(({ era, count }) => {
                    const active = activeEras.includes(era);
                    return (
                      <button
                        key={era}
                        type="button"
                        onClick={() => toggle("eras", String(era))}
                        aria-pressed={active}
                        className={cn(
                          "rounded px-2 py-0.5 font-mono text-[11px] tabular-nums transition-colors",
                          active
                            ? "bg-[color:var(--color-oxblood)] text-[color:var(--color-brand-white)]"
                            : "text-[color:var(--color-body)] hover:bg-[color:var(--color-paper)]",
                        )}
                      >
                        ’{String(era).slice(-2)}
                        <span className="ml-1 text-[10px] opacity-70">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {anyActive ? (
        <button
          type="button"
          onClick={() => setParams({ sort: null, roles: null, eras: null })}
          className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--color-brand-red)] underline underline-offset-4"
        >
          Clear all
        </button>
      ) : null}
    </div>
  );
}
