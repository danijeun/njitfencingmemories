import { Link } from "next-view-transitions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type DirectoryFilterValues = {
  role: "athlete" | "alumni" | "coach" | null;
  year: number | null;
  q: string;
  sort: "name" | "year";
};

export function DirectoryFilters({
  values,
  className,
}: {
  values: DirectoryFilterValues;
  className?: string;
}) {
  const labelCls = "font-mono text-[10px] uppercase tracking-widest text-[color:var(--color-ink)]";
  const fieldCls =
    "h-9 w-full rounded-md border border-[color:var(--color-rule)] bg-[color:var(--color-ivory)] px-3 text-sm text-[color:var(--color-ink)]";

  return (
    <form action="/alumni" method="get" className={cn("flex flex-col gap-4", className)}>
      <label className="flex flex-col gap-1.5">
        <span className={labelCls}>Name</span>
        <Input
          type="search"
          name="q"
          defaultValue={values.q}
          placeholder="e.g. Smith"
          maxLength={80}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={labelCls}>Role</span>
        <select name="role" defaultValue={values.role ?? ""} className={fieldCls}>
          <option value="">Any</option>
          <option value="athlete">Athlete</option>
          <option value="alumni">Alum</option>
          <option value="coach">Coach</option>
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={labelCls}>Class year</span>
        <Input
          type="number"
          inputMode="numeric"
          name="year"
          min={1980}
          max={2100}
          defaultValue={values.year ?? ""}
          placeholder="e.g. 2003"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={labelCls}>Sort</span>
        <select name="sort" defaultValue={values.sort} className={fieldCls}>
          <option value="name">Name (A→Z)</option>
          <option value="year">Class year (newest)</option>
        </select>
      </label>

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" size="sm">
          Apply
        </Button>
        <Link
          href="/alumni"
          className="font-mono text-[11px] uppercase tracking-widest text-[color:var(--color-body)] underline decoration-[color:var(--color-rule)] underline-offset-4 hover:text-[color:var(--color-oxblood)]"
        >
          Reset
        </Link>
      </div>
    </form>
  );
}
