import { Skeleton } from "@/components/ui/skeleton";
import { HighlandersGridSkeleton } from "@/components/skeletons/HighlandersGridSkeleton";

export default function Loading() {
  return (
    <main className="flex-1 px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-12 w-full rounded-md" />
        <HighlandersGridSkeleton count={12} />
      </div>
    </main>
  );
}
