import { createClient } from "@/lib/supabase/server";
import { Link } from "next-view-transitions";
import { MemoryFab } from "@/components/memory/MemoryFab";
import { FilterSheet } from "@/components/memory/FilterSheet";
import { FeedFiltersPanel, FeedTabs } from "@/components/memory/FeedFilters";
import { FeedList } from "@/components/memory/FeedList";
import { FeedRightRail } from "@/components/memory/FeedRightRail";
import { InlineComposer } from "@/components/memory/InlineComposer";
import { signedAvatarUrls } from "@/lib/storage/avatars";
import { fetchFeedPage, type FeedFilters, type FeedRole, type FeedSort } from "./feed";
import type { EraCount } from "@/components/memory/TimelineRail";

export const dynamic = "force-dynamic";

const ROLE_VALUES: FeedRole[] = ["athlete", "alumni", "coach"];

function parseRoles(raw: string | undefined): FeedRole[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is FeedRole => (ROLE_VALUES as string[]).includes(s));
}

function parseEras(raw: string | undefined): number[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n >= 1980 && n <= 2100);
}

function parseSort(raw: string | undefined): FeedSort {
  return raw === "oldest" ? "oldest" : "newest";
}

export default async function MemoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; roles?: string; eras?: string }>;
}) {
  const sp = await searchParams;
  const filters: FeedFilters = {
    sort: parseSort(sp.sort),
    roles: parseRoles(sp.roles),
    eras: parseEras(sp.eras),
  };

  const supabase = await createClient();
  const [{ data: eraRows }, userResult, firstPage] = await Promise.all([
    supabase.rpc("memory_era_counts"),
    supabase.auth.getUser(),
    fetchFeedPage(filters, null),
  ]);
  const eras = (eraRows ?? []) as EraCount[];
  const user = userResult.data.user;
  const isAuthed = Boolean(user);

  let composerAvatar: string | null = null;
  let composerName: string | null = null;
  if (user) {
    const { data: me } = await supabase
      .from("profiles")
      .select("full_name, avatar_path")
      .eq("id", user.id)
      .maybeSingle();
    composerName = me?.full_name ?? null;
    if (me?.avatar_path) {
      const map = await signedAvatarUrls(supabase, [me.avatar_path]);
      composerAvatar = map.get(me.avatar_path) ?? null;
    }
  }

  return (
    <main className="flex-1">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-0 lg:grid-cols-[260px_minmax(0,600px)_320px] lg:gap-8 lg:px-8">
        {/* Left rail (desktop) */}
        <aside className="hidden lg:block lg:py-10">
          <div className="sticky top-6 max-h-[calc(100dvh-3rem)] overflow-y-auto pr-2">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--color-body)]">
              Filters
            </p>
            <div className="mt-4">
              <FeedFiltersPanel eras={eras} />
            </div>
          </div>
        </aside>

        {/* Center feed */}
        <section
          className="border-x-0 lg:border-x lg:border-[color:var(--color-rule)]"
          aria-label="Memory feed"
        >
          {/* Mobile / tablet header */}
          <header className="flex items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:hidden">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--color-body)]">
                The archive
              </p>
              <h1 className="mt-1 font-display text-3xl leading-none text-[color:var(--color-ink)]">
                Memories
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {isAuthed ? (
                <Link
                  href="/memories/drafts"
                  className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--color-body)] hover:text-[color:var(--color-brand-red)]"
                >
                  Drafts
                </Link>
              ) : null}
              <FilterSheet eras={eras} />
            </div>
          </header>

          {/* Desktop title */}
          <header className="hidden px-6 pb-4 pt-10 lg:block">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--color-body)]">
              The archive
            </p>
            <div className="mt-1 flex items-baseline justify-between gap-4">
              <h1 className="font-display text-4xl leading-none text-[color:var(--color-ink)]">
                Memories
              </h1>
              {isAuthed ? (
                <Link
                  href="/memories/drafts"
                  className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--color-body)] hover:text-[color:var(--color-brand-red)]"
                >
                  Drafts
                </Link>
              ) : null}
            </div>
          </header>

          <FeedTabs />

          {isAuthed ? <InlineComposer avatarUrl={composerAvatar} name={composerName} /> : null}

          <FeedList
            initialItems={firstPage.items}
            initialCursor={firstPage.nextCursor}
            filters={filters}
          />
        </section>

        {/* Right rail (desktop) */}
        <aside className="hidden lg:block lg:py-10">
          <div className="sticky top-6 max-h-[calc(100dvh-3rem)] overflow-y-auto pr-2">
            <FeedRightRail eras={eras} />
          </div>
        </aside>
      </div>

      {isAuthed ? <MemoryFab /> : null}
    </main>
  );
}
