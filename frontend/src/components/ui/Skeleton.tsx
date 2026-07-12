export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-gray-200/80 ${className}`} />;
}

export function PropertyCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
    </div>
  );
}

export function PropertyGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <PropertyCardSkeleton key={i} />
      ))}
    </div>
  );
}
