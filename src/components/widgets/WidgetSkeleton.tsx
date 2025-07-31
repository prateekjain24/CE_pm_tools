interface WidgetSkeletonProps {
  title?: string
  lines?: number
  variant?: "default" | "calculator" | "feed"
}

export function WidgetSkeleton({ lines = 3, variant = "default" }: WidgetSkeletonProps) {
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

      {/* Content skeleton based on variant */}
      <div className="p-4">
        {variant === "calculator" && (
          <div className="space-y-4">
            {/* Input fields skeleton */}
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={`calc-input-${i}`} className="space-y-2">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              ))}
            </div>
            {/* Result skeleton */}
            <div className="mt-6 flex flex-col items-center space-y-2">
              <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-full" />
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24" />
            </div>
          </div>
        )}

        {variant === "feed" && (
          <div className="space-y-3">
            {Array.from({ length: lines }).map((_, i) => (
              <div
                key={`feed-item-${i}`}
                className="pb-3 border-b border-gray-100 dark:border-gray-700/50 last:border-0"
              >
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mb-2" />
                <div className="flex items-center space-x-4">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                </div>
              </div>
            ))}
          </div>
        )}

        {variant === "default" && (
          <div className="space-y-3">
            {Array.from({ length: lines }).map((_, i) => (
              <div key={`default-line-${i}`} className="space-y-2">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                {i === 0 && <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
