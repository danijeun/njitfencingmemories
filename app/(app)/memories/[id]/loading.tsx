import { MemoryDetailSkeleton } from "@/components/skeletons/MemoryDetailSkeleton";

export default function Loading() {
  return (
    <main className="flex-1 px-4 py-10 sm:px-6 lg:px-10">
      <article className="mx-auto max-w-2xl">
        <MemoryDetailSkeleton />
      </article>
    </main>
  );
}
