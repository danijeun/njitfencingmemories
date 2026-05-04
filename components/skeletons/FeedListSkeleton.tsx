import { Skeleton, SkeletonRegion } from "@/components/ui/skeleton";

export function FeedListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <SkeletonRegion label="Loading memories">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border-b border-[color:var(--color-rule)] px-4 py-5 sm:px-6">
          <div className="flex gap-3 sm:gap-4">
            <Skeleton className="size-11 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-12" />
                <Skeleton className="ml-auto h-4 w-14 rounded-full" />
              </div>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
              {i % 2 === 0 ? <Skeleton className="mt-2 aspect-[16/9] w-full rounded-xl" /> : null}
              <div className="flex items-center gap-6 pt-1">
                <Skeleton className="h-3 w-8" />
                <Skeleton className="h-3 w-8" />
                <Skeleton className="h-3 w-8" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </SkeletonRegion>
  );
}
