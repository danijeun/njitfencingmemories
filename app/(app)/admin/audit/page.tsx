import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProfile, getSessionUser } from "@/lib/auth/profile";

type Audit = {
  id: number;
  actor_id: string | null;
  action: "insert" | "update" | "delete";
  email: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  at: string;
};

export default async function AdminAuditPage() {
  const user = await getSessionUser();
  if (!user) notFound();
  const profile = await getProfile(user.id);
  if (!profile?.is_admin) notFound();

  const supabase = await createClient();
  const { data } = await supabase
    .from("roster_audit")
    .select("*")
    .order("at", { ascending: false })
    .limit(200);
  const rows = (data ?? []) as Audit[];

  const actorIds = Array.from(new Set(rows.map((r) => r.actor_id).filter((x): x is string => !!x)));
  const actorMap = new Map<string, string>();
  if (actorIds.length) {
    const { data: actors } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", actorIds);
    for (const a of actors ?? []) actorMap.set(a.id as string, a.full_name as string);
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-10">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-[color:var(--color-ink)]">Roster audit</h1>
          <p className="mt-1 text-sm text-[color:var(--color-ink)]/70">Last 200 changes.</p>
        </div>
        <div className="flex gap-4">
          <Link
            href="/admin/roster"
            className="font-mono text-xs uppercase tracking-widest text-[color:var(--color-ink)] hover:opacity-70"
          >
            ← Roster
          </Link>
          <Link
            href="/admin/requests"
            className="font-mono text-xs uppercase tracking-widest text-[color:var(--color-ink)] hover:opacity-70"
          >
            Requests →
          </Link>
        </div>
      </div>

      <ul className="divide-y divide-[color:var(--color-rule)] rounded-md border border-[color:var(--color-rule)]">
        {rows.map((r) => (
          <li key={r.id} className="px-4 py-3">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--color-ink)]/70">
                {r.action}
              </span>
              <span className="font-mono text-sm text-[color:var(--color-ink)]">{r.email}</span>
              <span className="ml-auto font-mono text-xs text-[color:var(--color-ink)]/60">
                {new Date(r.at).toLocaleString()}
              </span>
            </div>
            <div className="mt-1 text-xs text-[color:var(--color-ink)]/60">
              by {r.actor_id ? (actorMap.get(r.actor_id) ?? r.actor_id) : "system"}
            </div>
            {r.action === "update" && r.before && r.after && (
              <pre className="mt-2 overflow-x-auto rounded bg-[color:var(--color-rule)]/20 p-2 text-xs">
                {diffSummary(r.before, r.after)}
              </pre>
            )}
          </li>
        ))}
        {rows.length === 0 && (
          <li className="px-4 py-6 text-sm text-[color:var(--color-ink)]/60">No changes yet.</li>
        )}
      </ul>
    </main>
  );
}

function diffSummary(before: Record<string, unknown>, after: Record<string, unknown>) {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const lines: string[] = [];
  for (const k of keys) {
    if (JSON.stringify(before[k]) !== JSON.stringify(after[k])) {
      lines.push(`${k}: ${JSON.stringify(before[k])} → ${JSON.stringify(after[k])}`);
    }
  }
  return lines.join("\n") || "(no field changes)";
}
