import { Skeleton } from "@/components/ui/skeleton";
import { SearchResultsSkeleton } from "@/components/skeletons/SearchResultsSkeleton";

export default function Loading() {
  return (
    <main className="flex-1 px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-12 w-full rounded-md" />
        <SearchResultsSkeleton count={6} />
      </div>
    </main>
  );
}
