import { Skeleton, SkeletonRegion } from "@/components/ui/skeleton";

export function FormSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <SkeletonRegion label="Loading form" className="mt-6 space-y-5">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      ))}
      <Skeleton className="h-24 w-full rounded-md" />
      <Skeleton className="h-10 w-32 rounded-md" />
    </SkeletonRegion>
  );
}
