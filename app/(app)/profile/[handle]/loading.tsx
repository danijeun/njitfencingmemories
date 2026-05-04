import { ProfileHeaderSkeleton } from "@/components/skeletons/ProfileHeaderSkeleton";

export default function Loading() {
  return (
    <main className="flex flex-1 justify-center px-6 py-12 sm:py-16">
      <div className="w-full max-w-md">
        <ProfileHeaderSkeleton />
      </div>
    </main>
  );
}
