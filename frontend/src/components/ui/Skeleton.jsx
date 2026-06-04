export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3 animate-pulse">
      <div className="flex justify-between">
        <div className="h-5 bg-gray-200 rounded w-1/4" />
        <div className="h-5 bg-gray-200 rounded-full w-24" />
      </div>
      <div className="h-4 bg-gray-200 rounded w-2/3" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
        <div className="h-5 bg-gray-200 rounded w-16" />
        <div className="h-8 bg-gray-200 rounded-lg w-24" />
      </div>
    </div>
  );
}

export function SkeletonDia() {
  return (
    <div className="space-y-3">
      <div className="h-6 bg-gray-200 rounded w-48 animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  );
}
