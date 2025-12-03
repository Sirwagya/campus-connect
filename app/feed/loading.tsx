import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="flex min-h-screen justify-center pt-8">
      <div className="w-full max-w-2xl space-y-6 px-4">
        {/* Create Post Skeleton */}
        <div className="bg-card rounded-lg p-4 space-y-4 border border-border">
          <div className="flex gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 flex-1 rounded-md" />
          </div>
        </div>

        {/* Feed Posts Skeleton */}
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-card rounded-lg p-4 space-y-4 border border-border"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-24 w-full rounded-md" />
            <div className="flex gap-4 pt-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
