import { Skeleton } from "@/components/ui/skeleton";
import { GalleryMasonrySkeleton } from "@/components/skeletons/GalleryMasonrySkeleton";

export default function Loading() {
  return (
    <main className="flex-1 px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-9 w-40" />
        <GalleryMasonrySkeleton count={18} />
      </div>
    </main>
  );
}
