import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProfile, getSessionUser } from "@/lib/auth/profile";
import { ModerationActions } from "./ModerationActions";

type FlagRow = {
  id: string;
  memory_id: string;
  reason: string;
  note: string | null;
  created_at: string;
  reporter_id: string;
};

type MemorySummary = {
  id: string;
  title: string;
  status: string;
  deleted_at: string | null;
  author_id: string;
  published_at: string | null;
};

type SearchParams = Promise<{ tab?: string }>;

export default async function AdminModerationPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getSessionUser();
  if (!user) notFound();
  const profile = await getProfile(user.id);
  if (!profile?.is_admin) notFound();

  const sp = await searchParams;
  const tab = (sp.tab === "deleted" ? "deleted" : "flagged") as "flagged" | "deleted";

  const supabase = await createClient();

  const [{ data: openFlags }, { data: deletedMemories }, { count: openFlagCount }] =
    await Promise.all([
      supabase
        .from("memory_flags")
        .select("id, memory_id, reason, note, created_at, reporter_id")
        .is("resolved_at", null)
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("memories")
        .select("id, title, status, deleted_at, author_id, published_at")
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false })
        .limit(200),
      supabase
        .from("memory_flags")
        .select("id", { count: "exact", head: true })
        .is("resolved_at", null),
    ]);

  const flags = (openFlags ?? []) as FlagRow[];
  const deleted = (deletedMemories ?? []) as MemorySummary[];

  // Resolve memory titles for flagged rows.
  const flagMemoryIds = Array.from(new Set(flags.map((f) => f.memory_id)));
  const reporterIds = Array.from(new Set(flags.map((f) => f.reporter_id)));
  const [{ data: flagMems }, { data: reporters }] = await Promise.all([
    flagMemoryIds.length
      ? supabase
          .from("memories")
          .select("id, title, status, deleted_at, author_id, published_at")
          .in("id", flagMemoryIds)
      : Promise.resolve({ data: [] as MemorySummary[] }),
    reporterIds.length
      ? supabase.from("profiles").select("id, full_name, slug").in("id", reporterIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string; slug: string | null }[] }),
  ]);
  const memMap = new Map<string, MemorySummary>();
  for (const m of (flagMems ?? []) as MemorySummary[]) memMap.set(m.id, m);
  const reporterMap = new Map<string, { full_name: string; slug: string | null }>();
  for (const r of (reporters ?? []) as { id: string; full_name: string; slug: string | null }[]) {
    reporterMap.set(r.id, { full_name: r.full_name, slug: r.slug });
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-10">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-[color:var(--color-ink)]">Moderation</h1>
          <p className="mt-1 text-sm text-[color:var(--color-ink)]/70">
            Reader-submitted flags and the soft-deleted memory bin.
          </p>
        </div>
        <div className="flex gap-4">
          <Link
            href="/admin/requests"
            className="font-mono text-xs uppercase tracking-widest text-[color:var(--color-ink)] hover:opacity-70"
          >
            Requests →
          </Link>
          <Link
            href="/admin/audit"
            className="font-mono text-xs uppercase tracking-widest text-[color:var(--color-ink)] hover:opacity-70"
          >
            Audit →
          </Link>
        </div>
      </div>

      <nav className="mb-4 flex gap-1 border-b border-[color:var(--color-rule)]">
        {(["flagged", "deleted"] as const).map((t) => {
          const active = t === tab;
          const count = t === "flagged" ? (openFlagCount ?? 0) : deleted.length;
          return (
            <Link
              key={t}
              href={`/admin/moderation?tab=${t}`}
              className={`-mb-px rounded-t px-4 py-2 font-mono text-xs uppercase tracking-widest ${
                active
                  ? "border-b-2 border-[color:var(--color-brand-red)] text-[color:var(--color-ink)]"
                  : "text-[color:var(--color-ink)]/60 hover:text-[color:var(--color-ink)]"
              }`}
            >
              {t} ({count})
            </Link>
          );
        })}
      </nav>

      {tab === "flagged" ? (
        <ul className="divide-y divide-[color:var(--color-rule)] rounded-md border border-[color:var(--color-rule)]">
          {flags.length === 0 ? (
            <li className="px-4 py-6 text-sm text-[color:var(--color-ink)]/60">No open flags.</li>
          ) : (
            flags.map((f) => {
              const mem = memMap.get(f.memory_id);
              const reporter = reporterMap.get(f.reporter_id);
              return (
                <li key={f.id} className="flex flex-wrap items-start gap-x-4 gap-y-2 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/memories/${f.memory_id}`}
                        className="truncate font-medium text-[color:var(--color-ink)] underline-offset-4 hover:underline"
                      >
                        {mem?.title ?? "(deleted memory)"}
                      </Link>
                      <span className="rounded bg-[color:var(--color-rule)]/30 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-[color:var(--color-ink)]/70">
                        {f.reason}
                      </span>
                      {mem?.deleted_at ? (
                        <span className="rounded bg-[color:var(--color-brand-red)]/15 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-[color:var(--color-brand-red)]">
                          deleted
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1 font-mono text-xs text-[color:var(--color-ink)]/60">
                      {new Date(f.created_at).toLocaleString()} ·{" "}
                      {reporter ? reporter.full_name : "unknown reporter"}
                    </div>
                    {f.note ? (
                      <p className="mt-2 text-sm text-[color:var(--color-body)]">“{f.note}”</p>
                    ) : null}
                  </div>
                  <ModerationActions
                    flagId={f.id}
                    memoryId={f.memory_id}
                    isDeleted={!!mem?.deleted_at}
                  />
                </li>
              );
            })
          )}
        </ul>
      ) : (
        <ul className="divide-y divide-[color:var(--color-rule)] rounded-md border border-[color:var(--color-rule)]">
          {deleted.length === 0 ? (
            <li className="px-4 py-6 text-sm text-[color:var(--color-ink)]/60">
              No soft-deleted memories.
            </li>
          ) : (
            deleted.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-[color:var(--color-ink)]">
                    {m.title}
                  </div>
                  <div className="font-mono text-xs text-[color:var(--color-ink)]/60">
                    deleted {m.deleted_at ? new Date(m.deleted_at).toLocaleString() : ""}
                  </div>
                </div>
                <ModerationActions memoryId={m.id} isDeleted />
              </li>
            ))
          )}
        </ul>
      )}
    </main>
  );
}
