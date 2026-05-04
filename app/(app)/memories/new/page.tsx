import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NewMemoryClient } from "./NewMemoryClient";

export const dynamic = "force-dynamic";

export default async function NewMemoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="flex flex-1 justify-center px-4 py-10 sm:px-6 sm:py-12 lg:px-10">
      <div className="w-full max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--color-ink)]">
          New memory
        </p>
        <h1 className="mt-3 font-display text-fluid-2xl text-[color:var(--color-ink)]">
          Tell the story
        </h1>
        <div className="mt-8">
          <NewMemoryClient />
        </div>
      </div>
    </main>
  );
}
