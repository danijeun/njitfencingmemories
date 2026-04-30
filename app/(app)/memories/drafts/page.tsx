import { redirect } from "next/navigation";
import { Link } from "next-view-transitions";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type DraftRow = {
  id: string;
  title: string;
  excerpt: string | null;
  cover_path: string | null;
  era: number | null;
  updated_at: string;
};

export default async function DraftsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?from=/memories/drafts");

  const { data } = await supabase
    .from("memories")
    .select("id, title, excerpt, cover_path, era, updated_at")
    .eq("author_id", user.id)
    .eq("status", "draft")
    .order("updated_at", { ascending: false })
    .limit(100);

  const drafts = (data ?? []) as DraftRow[];

  return (
    <main className="flex-1 px-4 py-10 sm:px-6 lg:px-10">
      <header className="mx-auto max-w-5xl">
        <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--color-ink)]">
          Your workspace
        </p>
        <div className="mt-3 flex items-end justify-between gap-4">
          <h1 className="font-display text-4xl leading-[1.05] text-[color:var(--color-ink)] sm:text-5xl">
            Drafts
          </h1>
          <Link
            href="/memories/new"
            className="font-mono text-xs uppercase tracking-widest text-[color:var(--color-brand-red)] hover:opacity-70"
          >
            New memory
          </Link>
        </div>
        <p className="mt-3 text-sm text-[color:var(--color-body)]">
          Only you can see these. Publish from the editor when one is ready.
        </p>
      </header>

      <section className="mx-auto mt-10 max-w-5xl">
        {drafts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[color:var(--color-rule)] p-10 text-center">
            <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--color-body)]">
              No drafts yet
            </p>
            <Link
              href="/memories/new"
              className="mt-4 inline-block font-display text-2xl text-[color:var(--color-brand-red)] hover:opacity-70"
            >
              Start a memory →
            </Link>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {drafts.map((d) => {
              const coverUrl = d.cover_path
                ? supabase.storage.from("memory-covers").getPublicUrl(d.cover_path).data.publicUrl
                : null;
              return (
                <li key={d.id}>
                  <Link
                    href={`/memories/${d.id}/edit`}
                    className="group block h-full rounded-lg border border-[color:var(--color-rule)] bg-[color:var(--color-paper)] p-4 transition-colors hover:border-[color:var(--color-ink)]"
                  >
                    {coverUrl ? (
                      <div className="relative mb-4 aspect-[3/2] overflow-hidden rounded bg-[color:var(--color-rule)]">
                        <Image
                          src={coverUrl}
                          alt=""
                          fill
                          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                          className="object-cover"
                        />
                      </div>
                    ) : null}
                    <div className="flex items-baseline justify-between gap-3 font-mono text-[10px] uppercase tracking-widest text-[color:var(--color-body)]">
                      <span>{d.era ?? "Draft"}</span>
                      <time dateTime={d.updated_at}>
                        {new Date(d.updated_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </time>
                    </div>
                    <h2 className="mt-2 font-display text-2xl leading-tight text-[color:var(--color-ink)]">
                      {d.title || "Untitled"}
                    </h2>
                    {d.excerpt ? (
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-[color:var(--color-body)]">
                        {d.excerpt}
                      </p>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
