import { Skeleton, SkeletonRegion } from "@/components/ui/skeleton";

export function EditorSkeleton() {
  return (
    <SkeletonRegion label="Loading editor" className="space-y-5">
      <Skeleton className="aspect-[16/9] w-full rounded-xl" />
      <Skeleton className="h-10 w-3/4" />
      <Skeleton className="h-9 w-1/3" />
      <div className="rounded-xl border border-[color:var(--color-rule)]">
        <div className="flex flex-wrap gap-2 border-b border-[color:var(--color-rule)] p-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-8 rounded" />
          ))}
        </div>
        <div className="space-y-3 p-4">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-11/12" />
          <Skeleton className="h-3 w-4/5" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      </div>
    </SkeletonRegion>
  );
}
