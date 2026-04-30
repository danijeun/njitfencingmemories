import { FeedListSkeleton } from "@/components/skeletons/FeedListSkeleton";

export default function Loading() {
  return (
    <main className="flex-1">
      <div className="mx-auto max-w-2xl">
        <FeedListSkeleton count={5} />
      </div>
    </main>
  );
}
