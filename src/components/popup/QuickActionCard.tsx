import type { ReactNode } from "react"

interface QuickActionCardProps {
  id: string
  title: string
  description?: string
  icon?: ReactNode
  onClick: () => void
  usageCount?: number
  isNew?: boolean
  isPro?: boolean
  className?: string
}

export function QuickActionCard({
  title,
  description,
  icon,
  onClick,
  usageCount,
  isNew,
  isPro,
  className = "",
}: QuickActionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 dark:hover:border-primary-400 hover:shadow-md transition-all duration-200 text-left ${className}`}
    >
      {/* Badge */}
      {(isNew || isPro) && (
        <div className="absolute top-2 right-2">
          {isNew && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              New
            </span>
          )}
          {isPro && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
              Pro
            </span>
          )}
        </div>
      )}

      {/* Icon */}
      {icon && (
        <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center mb-3 group-hover:bg-primary-200 dark:group-hover:bg-primary-800/40 transition-colors">
          <div className="text-primary-600 dark:text-primary-400">{icon}</div>
        </div>
      )}

      {/* Content */}
      <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">{title}</h3>
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{description}</p>
      )}

      {/* Usage indicator */}
      {usageCount !== undefined && usageCount > 0 && (
        <div className="mt-2 flex items-center text-xs text-gray-400 dark:text-gray-500">
          <svg
            className="w-3 h-3 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            />
          </svg>
          Used {usageCount} {usageCount === 1 ? "time" : "times"}
        </div>
      )}
    </button>
  )
}
