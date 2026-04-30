import { Skeleton, SkeletonRegion } from "@/components/ui/skeleton";

export function MemoryDetailSkeleton() {
  return (
    <SkeletonRegion label="Loading memory" className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-10 w-5/6" />
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="aspect-[3/2] w-full rounded-xl" />
      <div className="space-y-3 pt-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-11/12" />
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </SkeletonRegion>
  );
}
