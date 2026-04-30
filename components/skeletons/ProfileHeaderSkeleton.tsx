import { Skeleton, SkeletonRegion } from "@/components/ui/skeleton";

export function ProfileHeaderSkeleton() {
  return (
    <SkeletonRegion label="Loading profile" className="space-y-5">
      <Skeleton className="h-3 w-40" />
      <div className="flex items-center gap-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="space-y-2 pt-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-11/12" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </SkeletonRegion>
  );
}
