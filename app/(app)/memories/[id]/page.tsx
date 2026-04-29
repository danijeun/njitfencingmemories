import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { MemoryBody } from "@/components/memory/MemoryBody";

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

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const canEdit = !!user && user.id === memory.author_id;

  let author: { full_name: string; slug: string | null } | null = null;
  if (memory.author_id) {
    const { data } = await supabase.rpc("get_public_profile", { p_id: memory.author_id });
    const row = (data as { full_name: string; slug: string | null }[] | null)?.[0];
    author = row ? { full_name: row.full_name, slug: row.slug } : null;
  }

  const coverUrl = memory.cover_path
    ? supabase.storage.from("memory-covers").getPublicUrl(memory.cover_path).data.publicUrl
    : null;

  return (
    <main className="flex-1 px-4 py-10 sm:px-6 lg:px-10">
      <article className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/memories"
            className="font-mono text-xs uppercase tracking-widest text-[color:var(--color-body)] hover:opacity-70"
          >
            ← All memories
          </Link>
          {canEdit ? (
            <Link
              href={`/memories/${memory.id}/edit`}
              className="font-mono text-xs uppercase tracking-widest text-[color:var(--color-brand-red)] hover:opacity-70"
            >
              Edit
              {memory.status === "draft" ? " (draft)" : ""}
            </Link>
          ) : null}
        </div>
        <p className="mt-6 font-mono text-xs uppercase tracking-widest text-[color:var(--color-body)]">
          {memory.era ?? ""}
        </p>
        <h1 className="mt-3 font-display text-4xl leading-[1.05] text-[color:var(--color-ink)] sm:text-5xl">
          {memory.title}
        </h1>
        {author ? (
          <p className="mt-3 text-sm text-[color:var(--color-body)]">
            By{" "}
            {author.slug ? (
              <Link href={`/profile/${author.slug}`} className="underline hover:opacity-70">
                {author.full_name}
              </Link>
            ) : (
              author.full_name
            )}
          </p>
        ) : null}
        {coverUrl ? (
          <div className="relative mt-8 aspect-[3/2] overflow-hidden rounded-lg border border-[color:var(--color-rule)]">
            <Image
              src={coverUrl}
              alt=""
              fill
              priority
              sizes="(min-width: 768px) 42rem, 100vw"
              className="object-cover"
              style={{ viewTransitionName: `memory-cover-${memory.id}` }}
            />
          </div>
        ) : null}
        {memory.excerpt ? (
          <p className="mt-6 text-lg leading-8 text-[color:var(--color-body)]">{memory.excerpt}</p>
        ) : null}
        <div className="mt-8 text-base">
          <MemoryBody body={memory.body} />
        </div>
      </article>
    </main>
  );
}
