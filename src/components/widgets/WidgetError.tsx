interface WidgetErrorProps {
  error: Error
  onRetry?: () => void
}

export function WidgetError({ error, onRetry }: WidgetErrorProps) {
  return (
    <div className="widget-error p-6 text-center">
      <svg
        className="w-8 h-8 mb-3 mx-auto text-red-500 dark:text-red-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        role="img"
        aria-label="Error icon"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
        Failed to load widget
      </p>
      <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
        {error.message || "An unexpected error occurred"}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 rounded-md transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  )
}
