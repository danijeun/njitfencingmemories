import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function MemoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: memory } = await supabase
    .from("memories")
    .select("id, title, excerpt, body, cover_path, era, published_at, author_id, status")
    .eq("id", id)
    .maybeSingle();

  if (!memory) notFound();

  let author: { full_name: string; slug: string } | null = null;
  if (memory.author_id) {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, slug")
      .eq("id", memory.author_id)
      .maybeSingle();
    author = data ?? null;
  }

  return (
    <main className="flex-1 px-4 py-10 sm:px-6 lg:px-10">
      <article className="mx-auto max-w-2xl">
        <Link
          href="/memories"
          className="font-mono text-xs uppercase tracking-widest text-[color:var(--color-body)] hover:opacity-70"
        >
          ← All memories
        </Link>
        <p className="mt-6 font-mono text-xs uppercase tracking-widest text-[color:var(--color-body)]">
          {memory.era ?? ""}
        </p>
        <h1 className="mt-3 font-display text-4xl leading-[1.05] text-[color:var(--color-ink)] sm:text-5xl">
          {memory.title}
        </h1>
        {author ? (
          <p className="mt-3 text-sm text-[color:var(--color-body)]">
            By{" "}
            <Link href={`/profile/${author.slug}`} className="underline hover:opacity-70">
              {author.full_name}
            </Link>
          </p>
        ) : null}
        {memory.excerpt ? (
          <p className="mt-6 text-lg leading-8 text-[color:var(--color-body)]">{memory.excerpt}</p>
        ) : null}
        {/* Body renderer + comments/reactions land in Sprint 4. */}
      </article>
    </main>
  );
}
