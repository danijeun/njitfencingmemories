import { createClient } from "@/lib/supabase/server";
import { signedAvatarUrls } from "@/lib/storage/avatars";
import { AlumniCard } from "@/components/profile/AlumniCard";
import {
  DirectoryFilters,
  type DirectoryFilterValues,
} from "@/components/profile/DirectoryFilters";
import { DirectoryFiltersSheet } from "@/components/profile/DirectoryFiltersSheet";

export const dynamic = "force-dynamic";

const PAGE_LIMIT = 60;
const ROLES = new Set(["athlete", "alumni", "coach"]);

type RawSearchParams = {
  role?: string;
  year?: string;
  q?: string;
  sort?: string;
};

function parseFilters(raw: RawSearchParams): DirectoryFilterValues {
  const role = raw.role && ROLES.has(raw.role) ? (raw.role as DirectoryFilterValues["role"]) : null;
  const yearN = raw.year ? Number(raw.year) : NaN;
  const year = Number.isInteger(yearN) && yearN >= 1980 && yearN <= 2100 ? yearN : null;
  const q = (raw.q ?? "").trim().slice(0, 80);
  const sort = raw.sort === "year" ? "year" : "name";
  return { role, year, q, sort };
}

function activeCount(v: DirectoryFilterValues) {
  let n = 0;
  if (v.role) n++;
  if (v.year !== null) n++;
  if (v.q) n++;
  return n;
}

export default async function AlumniPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const raw = await searchParams;
  const filters = parseFilters(raw);

  const supabase = await createClient();
  let query = supabase
    .from("profiles")
    .select("id, full_name, slug, role, class_year, major, avatar_path")
    .not("onboarded_at", "is", null)
    .limit(PAGE_LIMIT);

  if (filters.role) query = query.eq("role", filters.role);
  if (filters.year !== null) query = query.eq("class_year", filters.year);
  if (filters.q) query = query.ilike("full_name", `%${filters.q}%`);

  if (filters.sort === "year") {
    query = query.order("class_year", { ascending: false }).order("full_name", { ascending: true });
  } else {
    query = query.order("full_name", { ascending: true });
  }

  const { data: rows, error } = await query;
  const profiles = (rows ?? []) as Array<{
    id: string;
    full_name: string;
    slug: string | null;
    role: "athlete" | "alumni" | "coach";
    class_year: number;
    major: string | null;
    avatar_path: string | null;
  }>;

  const avatarMap = await signedAvatarUrls(
    supabase,
    profiles.map((p) => p.avatar_path),
  );

  const count = activeCount(filters);

  return (
    <main className="flex-1 px-4 py-10 sm:px-6 lg:px-10">
      <header className="mx-auto max-w-7xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--color-ink)]">
              The roster
            </p>
            <h1 className="mt-3 font-display text-4xl leading-[1.05] text-[color:var(--color-ink)] sm:text-5xl">
              Alumni
            </h1>
          </div>
          <DirectoryFiltersSheet activeCount={count}>
            <DirectoryFilters values={filters} />
          </DirectoryFiltersSheet>
        </div>
      </header>

      <div className="mx-auto mt-10 grid max-w-7xl gap-10 lg:grid-cols-[16rem_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <DirectoryFilters values={filters} />
          </div>
        </aside>

        <section aria-live="polite">
          {error ? (
            <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--color-oxblood)]">
              Couldn’t load directory.
            </p>
          ) : profiles.length === 0 ? (
            <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--color-body)]">
              {count > 0 ? "No matches. Try fewer filters." : "Nobody has finished onboarding yet."}
            </p>
          ) : (
            <>
              <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--color-body)]">
                {profiles.length} {profiles.length === 1 ? "person" : "people"}
                {profiles.length === PAGE_LIMIT ? ` · showing top ${PAGE_LIMIT}` : ""}
              </p>
              <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {profiles.map((p) => (
                  <li key={p.id}>
                    <AlumniCard
                      profile={p}
                      avatarUrl={p.avatar_path ? (avatarMap.get(p.avatar_path) ?? null) : null}
                    />
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
