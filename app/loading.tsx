import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="container mx-auto px-4 md:px-8 py-8 space-y-8">
      <div className="space-y-4">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}
