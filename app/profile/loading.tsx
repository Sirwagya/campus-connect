import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Header Skeleton */}
      <div className="relative h-64 md:h-80 w-full bg-muted animate-pulse">
        <div className="absolute -bottom-16 left-4 md:left-8">
          <Skeleton className="h-32 w-32 rounded-full border-4 border-background" />
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 max-w-7xl mt-20 space-y-8">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
          <div className="lg:col-span-4 space-y-8 hidden lg:block">
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
