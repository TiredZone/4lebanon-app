export default function RecentLoading() {
  return (
    <div className="mx-auto max-w-4xl animate-pulse px-4 py-8">
      <div className="mb-8 h-8 w-48 rounded bg-gray-200" />
      <div className="space-y-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-lg border border-gray-100 p-4">
            <div className="h-4 w-16 rounded bg-gray-200" />
            <div className="h-4 flex-1 rounded bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  )
}
