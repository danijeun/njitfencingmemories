import { Skeleton, SkeletonRegion } from "@/components/ui/skeleton";

const HEIGHTS = ["h-40", "h-56", "h-72", "h-48", "h-64", "h-44", "h-60", "h-52"];

export function GalleryMasonrySkeleton({ count = 18 }: { count?: number }) {
  return (
    <SkeletonRegion
      label="Loading gallery"
      className="columns-2 gap-3 sm:columns-3 lg:columns-4 [&>*]:mb-3"
    >
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton
          key={i}
          className={`w-full break-inside-avoid rounded-lg ${HEIGHTS[i % HEIGHTS.length]}`}
        />
      ))}
    </SkeletonRegion>
  );
}
