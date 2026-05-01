import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProfile, getSessionUser } from "@/lib/auth/profile";
import { AddRosterForm } from "./AddRosterForm";
import { RosterRow } from "./RosterRow";

type Roster = {
  email: string;
  role: "athlete" | "alumni" | "coach";
  class_year: number;
  full_name: string;
  invited_at: string;
  claimed_at: string | null;
};

export default async function AdminRosterPage() {
  const user = await getSessionUser();
  if (!user) notFound();
  const profile = await getProfile(user.id);
  if (!profile?.is_admin) notFound();

  const supabase = await createClient();
  const { data } = await supabase
    .from("roster")
    .select("email, role, class_year, full_name, invited_at, claimed_at")
    .order("invited_at", { ascending: false });
  const rows = (data ?? []) as Roster[];

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-10">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-[color:var(--color-ink)]">Roster</h1>
          <p className="mt-1 text-sm text-[color:var(--color-ink)]/70">
            People allowed to sign in and post memories.
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
            Audit log →
          </Link>
        </div>
      </div>

      <section className="mb-10 rounded-md border border-[color:var(--color-rule)] p-4">
        <h2 className="mb-3 font-mono text-xs uppercase tracking-widest">Add member</h2>
        <AddRosterForm />
      </section>

      <section>
        <h2 className="mb-3 font-mono text-xs uppercase tracking-widest">
          {rows.length} member{rows.length === 1 ? "" : "s"}
        </h2>
        <ul className="divide-y divide-[color:var(--color-rule)] rounded-md border border-[color:var(--color-rule)]">
          {rows.map((r) => (
            <RosterRow key={r.email} row={r} />
          ))}
          {rows.length === 0 && (
            <li className="px-4 py-6 text-sm text-[color:var(--color-ink)]/60">No members yet.</li>
          )}
        </ul>
      </section>
    </main>
  );
}
