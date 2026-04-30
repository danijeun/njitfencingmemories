import { Link } from "next-view-transitions";
import { cn } from "@/lib/utils";

export type EraCount = { era: number; count: number };

type Orientation = "horizontal" | "vertical";

function groupByDecade(eras: EraCount[]) {
  const map = new Map<number, EraCount[]>();
  for (const e of eras) {
    const decade = Math.floor(e.era / 10) * 10;
    const list = map.get(decade) ?? [];
    list.push(e);
    map.set(decade, list);
  }
  return Array.from(map.entries())
    .map(([decade, items]) => ({
      decade,
      total: items.reduce((s, i) => s + i.count, 0),
      items: items.sort((a, b) => a.era - b.era),
    }))
    .sort((a, b) => a.decade - b.decade);
}

export function TimelineRail({
  eras,
  active,
  orientation = "horizontal",
  className,
}: {
  eras: EraCount[];
  active: number | null;
  orientation?: Orientation;
  className?: string;
}) {
  const decades = groupByDecade(eras);
  if (decades.length === 0) return null;

  const isH = orientation === "horizontal";

  return (
    <nav
      aria-label="Filter memories by era"
      className={cn(
        "font-mono text-[11px] uppercase tracking-widest text-[color:var(--color-body)]",
        isH ? "flex flex-wrap items-start gap-x-6 gap-y-4" : "flex flex-col gap-4",
        className,
      )}
    >
      <Link
        href="/memories"
        scroll={false}
        className={cn(
          "rounded px-1.5 py-0.5 transition-colors hover:text-[color:var(--color-oxblood)]",
          active === null
            ? "bg-[color:var(--color-ink)] text-[color:var(--color-brand-white)]"
            : "",
        )}
      >
        All eras
      </Link>
      {decades.map(({ decade, total, items }) => {
        const decadeActive = active !== null && active >= decade && active < decade + 10;
        return (
          <div key={decade} className={cn(isH ? "flex flex-col gap-1.5" : "flex flex-col gap-1.5")}>
            <span
              className={cn(
                "font-display text-base normal-case tracking-normal",
                decadeActive
                  ? "text-[color:var(--color-oxblood)]"
                  : "text-[color:var(--color-ink)]",
              )}
            >
              {decade}s{" "}
              <span className="font-mono text-[10px] tracking-widest text-[color:var(--color-body)]/70">
                · {total}
              </span>
            </span>
            <ul className="flex flex-wrap gap-x-3 gap-y-1">
              {items.map(({ era, count }) => {
                const isActive = active === era;
                return (
                  <li key={era}>
                    <Link
                      href={`/memories?era=${era}`}
                      scroll={false}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "rounded px-1 py-0.5 tabular-nums transition-colors",
                        isActive
                          ? "bg-[color:var(--color-oxblood)] text-[color:var(--color-brand-white)]"
                          : "hover:text-[color:var(--color-oxblood)]",
                      )}
                    >
                      <span aria-hidden>’{String(era).slice(-2)}</span>
                      <span className="sr-only">{era}</span>
                      <span className="ml-1 text-[10px] text-[color:var(--color-body)]/60">
                        {count}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
