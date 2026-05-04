import { Link } from "next-view-transitions";
import { PenSquare } from "lucide-react";

export function InlineComposer({
  avatarUrl,
  name,
}: {
  avatarUrl: string | null;
  name: string | null;
}) {
  const first = name?.split(/\s+/)[0] ?? "Highlander";
  return (
    <Link
      href="/memories/new"
      className="flex items-center gap-3 border-b border-[color:var(--color-rule)] px-4 py-4 transition-colors hover:bg-[color:var(--color-paper)] sm:px-6"
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" className="size-10 shrink-0 rounded-full object-cover" />
      ) : (
        <span
          aria-hidden
          className="grid size-10 shrink-0 place-items-center rounded-full bg-[color:var(--color-rule)] font-mono text-xs uppercase text-[color:var(--color-ink)]"
        >
          {first[0] ?? "·"}
        </span>
      )}
      <span className="flex-1 text-sm text-[color:var(--color-body)]">
        Share a memory, {first}…
      </span>
      <span className="flex items-center gap-1.5 rounded-full bg-[color:var(--color-brand-red)] px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-[color:var(--color-brand-white)]">
        <PenSquare className="size-3.5" aria-hidden /> New
      </span>
    </Link>
  );
}
