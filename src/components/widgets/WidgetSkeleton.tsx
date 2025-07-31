interface WidgetSkeletonProps {
  title?: string
  lines?: number
}

export function WidgetSkeleton({ lines = 3 }: WidgetSkeletonProps) {
  return (
    <div className="widget-skeleton animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-700/50">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
        </div>
        <div className="flex space-x-1">
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        {/* biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton lines don't reorder */}
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            {i === 0 && <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />}
          </div>
        ))}
      </div>
    </div>
  )
}
