import { Skeleton, SkeletonRegion } from "@/components/ui/skeleton";

export function HighlandersGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <SkeletonRegion
      label="Loading highlanders"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-lg border border-[color:var(--color-rule)] bg-[color:var(--color-paper)] p-4"
        >
          <Skeleton className="h-14 w-14 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </SkeletonRegion>
  );
}
