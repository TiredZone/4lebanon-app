export default function SearchLoading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-4 py-8">
      <div className="mb-8 h-10 w-full rounded-lg bg-gray-200" />
      <div className="mb-6 flex gap-4">
        <div className="h-10 w-32 rounded bg-gray-200" />
        <div className="h-10 w-32 rounded bg-gray-200" />
        <div className="h-10 w-32 rounded bg-gray-200" />
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-lg">
            <div className="aspect-video bg-gray-200" />
            <div className="space-y-2 p-4">
              <div className="h-4 w-3/4 rounded bg-gray-200" />
              <div className="h-3 w-1/2 rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
