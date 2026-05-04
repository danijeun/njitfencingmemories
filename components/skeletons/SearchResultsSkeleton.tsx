import { Skeleton, SkeletonRegion } from "@/components/ui/skeleton";

export function SearchResultsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <SkeletonRegion
      label="Searching"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-lg border border-[color:var(--color-rule)] bg-[color:var(--color-paper)]"
        >
          <Skeleton className="aspect-[3/2] w-full rounded-none" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
      ))}
    </SkeletonRegion>
  );
}
