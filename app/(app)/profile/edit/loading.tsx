import { Skeleton } from "@/components/ui/skeleton";
import { FormSkeleton } from "@/components/skeletons/FormSkeleton";

export default function Loading() {
  return (
    <main className="flex flex-1 justify-center px-6 py-12 sm:py-16">
      <div className="w-full max-w-md">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-3 h-9 w-48" />
        <FormSkeleton rows={4} />
      </div>
    </main>
  );
}
