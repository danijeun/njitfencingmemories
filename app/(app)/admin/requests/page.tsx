import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProfile, getSessionUser } from "@/lib/auth/profile";
import { RequestRow, type RequestRowData } from "./RequestRow";

type Row = {
  id: string;
  email: string;
  full_name: string;
  status: "pending" | "approved" | "declined";
  requested_at: string;
  decided_at: string | null;
  decided_by: string | null;
};

type SearchParams = Promise<{ tab?: string }>;

export default async function AdminRequestsPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await getSessionUser();
  if (!user) notFound();
  const profile = await getProfile(user.id);
  if (!profile?.is_admin) notFound();

  const sp = await searchParams;
  const tab = (sp.tab === "approved" || sp.tab === "declined" ? sp.tab : "pending") as
    | "pending"
    | "approved"
    | "declined";

  const supabase = await createClient();
  const { data } = await supabase
    .from("access_requests")
    .select("id, email, full_name, status, requested_at, decided_at, decided_by")
    .order("requested_at", { ascending: false });
  const all = (data ?? []) as Row[];
  const rows = all.filter((r) => r.status === tab);

  // Resolve actor names for "decided by".
  const actorIds = Array.from(
    new Set(all.map((r) => r.decided_by).filter((x): x is string => !!x)),
  );
  const actorMap = new Map<string, string>();
  if (actorIds.length) {
    const { data: actors } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", actorIds);
    for (const a of actors ?? []) actorMap.set(a.id as string, a.full_name as string);
  }

  // Count prior requests per email so the row can show a "N prior" badge.
  const priorByEmail = new Map<string, number>();
  for (const r of all) {
    priorByEmail.set(r.email.toLowerCase(), (priorByEmail.get(r.email.toLowerCase()) ?? 0) + 1);
  }

  const counts = {
    pending: all.filter((r) => r.status === "pending").length,
    approved: all.filter((r) => r.status === "approved").length,
    declined: all.filter((r) => r.status === "declined").length,
  };

  const rowsForView: RequestRowData[] = rows.map((r) => ({
    id: r.id,
    email: r.email,
    full_name: r.full_name,
    status: r.status,
    requested_at: r.requested_at,
    decided_at: r.decided_at,
    decided_by_name: r.decided_by ? (actorMap.get(r.decided_by) ?? null) : null,
    prior_count: Math.max(0, (priorByEmail.get(r.email.toLowerCase()) ?? 1) - 1),
  }));

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-10">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-[color:var(--color-ink)]">Access requests</h1>
          <p className="mt-1 text-sm text-[color:var(--color-ink)]/70">
            People asking to be added to the roster.
          </p>
        </div>
        <div className="flex gap-4">
          <Link
            href="/admin/roster"
            className="font-mono text-xs uppercase tracking-widest text-[color:var(--color-ink)] hover:opacity-70"
          >
            Roster →
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
        {(["pending", "approved", "declined"] as const).map((t) => {
          const active = t === tab;
          return (
            <Link
              key={t}
              href={`/admin/requests?tab=${t}`}
              className={`-mb-px rounded-t px-4 py-2 font-mono text-xs uppercase tracking-widest ${
                active
                  ? "border-b-2 border-[color:var(--color-brand-red)] text-[color:var(--color-ink)]"
                  : "text-[color:var(--color-ink)]/60 hover:text-[color:var(--color-ink)]"
              }`}
            >
              {t} ({counts[t]})
            </Link>
          );
        })}
      </nav>

      <ul className="divide-y divide-[color:var(--color-rule)] rounded-md border border-[color:var(--color-rule)]">
        {rowsForView.map((r) => (
          <RequestRow key={r.id} row={r} />
        ))}
        {rowsForView.length === 0 && (
          <li className="px-4 py-6 text-sm text-[color:var(--color-ink)]/60">No {tab} requests.</li>
        )}
      </ul>
    </main>
  );
}
