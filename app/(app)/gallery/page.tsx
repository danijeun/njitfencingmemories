import { createClient } from "@/lib/supabase/server";
import { extractImageSrcs } from "@/lib/memories/extract-images";
import { GalleryGrid, type GalleryItem } from "@/components/gallery/GalleryGrid";
import { coverUrl } from "@/lib/storage/publicUrl";

export const dynamic = "force-dynamic";

const MEMORY_LIMIT = 80;
const ITEM_LIMIT = 120;

export default async function GalleryPage() {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("memories")
    .select("id, title, cover_path, body, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(MEMORY_LIMIT);

  const memories = (rows ?? []) as Array<{
    id: string;
    title: string;
    cover_path: string | null;
    body: unknown;
    published_at: string | null;
  }>;

  const items: GalleryItem[] = [];
  const seen = new Set<string>();

  for (const m of memories) {
    if (m.cover_path) {
      const url = coverUrl(m.cover_path);
      if (url && !seen.has(url)) {
        seen.add(url);
        items.push({
          key: `${m.id}-cover`,
          memoryId: m.id,
          title: m.title,
          src: url,
          kind: "cover",
        });
      }
    }
    const inline = extractImageSrcs(m.body);
    inline.forEach((src, i) => {
      if (seen.has(src)) return;
      seen.add(src);
      items.push({
        key: `${m.id}-inline-${i}`,
        memoryId: m.id,
        title: m.title,
        src,
        kind: "inline",
      });
    });
  }

  const trimmed = items.slice(0, ITEM_LIMIT);

  return (
    <main className="flex-1 px-4 py-10 sm:px-6 lg:px-10">
      <header className="mx-auto max-w-7xl">
        <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--color-ink)]">
          The visuals
        </p>
        <h1 className="mt-3 font-display text-4xl leading-[1.05] text-[color:var(--color-ink)] sm:text-5xl">
          Gallery
        </h1>
        {trimmed.length > 0 ? (
          <p className="mt-3 font-mono text-xs uppercase tracking-widest text-[color:var(--color-body)]">
            {trimmed.length} {trimmed.length === 1 ? "image" : "images"}
            {items.length > ITEM_LIMIT ? ` · showing latest ${ITEM_LIMIT}` : ""}
          </p>
        ) : null}
      </header>

      <section className="mx-auto mt-10 max-w-7xl">
        {trimmed.length === 0 ? (
          <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--color-body)]">
            No images yet. Add a cover or embed photos in a memory.
          </p>
        ) : (
          <GalleryGrid items={trimmed} />
        )}
      </section>
    </main>
  );
}
