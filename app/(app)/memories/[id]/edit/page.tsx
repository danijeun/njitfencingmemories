import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditMemoryClient } from "./EditMemoryClient";

export const dynamic = "force-dynamic";

export default async function EditMemoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?from=/memories/${id}/edit`);

  const { data: memory } = await supabase
    .from("memories")
    .select("id, title, excerpt, body, cover_path, era, status, author_id")
    .eq("id", id)
    .maybeSingle();

  if (!memory) notFound();
  if (memory.author_id !== user.id) redirect(`/memories/${id}`);

  return (
    <main className="flex flex-1 justify-center px-4 py-10 sm:px-6 sm:py-12 lg:px-10">
      <div className="w-full max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--color-ink)]">
          Edit memory
        </p>
        <h1 className="mt-3 font-display text-fluid-2xl text-[color:var(--color-ink)]">
          Revise the story
        </h1>
        <div className="mt-8">
          <EditMemoryClient
            initial={{
              id: memory.id,
              title: memory.title,
              excerpt: memory.excerpt ?? "",
              era: memory.era,
              body: memory.body,
              cover_path: memory.cover_path,
              status: memory.status,
            }}
          />
        </div>
      </div>
    </main>
  );
}
