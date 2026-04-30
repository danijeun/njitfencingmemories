import { EditorSkeleton } from "@/components/skeletons/EditorSkeleton";

export default function Loading() {
  return (
    <main className="flex flex-1 justify-center px-4 py-10 sm:px-6 sm:py-12 lg:px-10">
      <div className="w-full max-w-3xl">
        <EditorSkeleton />
      </div>
    </main>
  );
}
