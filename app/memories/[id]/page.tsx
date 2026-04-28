import { notFound } from "next/navigation";
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

  return (
    <main className="flex-1 px-4 py-10 sm:px-6 lg:px-10">
      <article className="mx-auto max-w-2xl">
        <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--color-body)]">
          {memory.era ?? ""}
        </p>
        <h1 className="mt-3 font-display text-4xl leading-[1.05] text-[color:var(--color-ink)] sm:text-5xl">
          {memory.title}
        </h1>
        {memory.excerpt ? (
          <p className="mt-6 text-lg leading-8 text-[color:var(--color-body)]">{memory.excerpt}</p>
        ) : null}
        {/* Body renderer + comments/reactions land in Sprint 4. */}
      </article>
    </main>
  );
}
