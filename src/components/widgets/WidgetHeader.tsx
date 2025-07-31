import { type ReactNode, useState } from "react"

interface WidgetHeaderProps {
  title: string
  icon?: ReactNode
  onRefresh?: () => Promise<void> | void
  onSettings?: () => void
  loading?: boolean
}

export function WidgetHeader({ title, icon, onRefresh, onSettings, loading }: WidgetHeaderProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    if (!onRefresh || isRefreshing) return

    setIsRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className="widget-header flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-700/50">
      <div className="flex items-center space-x-2 flex-1 min-w-0">
        {icon && <div className="widget-icon text-gray-600 dark:text-gray-400">{icon}</div>}
        <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{title}</h3>
      </div>

      <div className="flex items-center space-x-1 ml-2">
        {/* Refresh Button */}
        {onRefresh && (
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing || loading}
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Refresh widget"
          >
            <svg
              className={`w-4 h-4 text-gray-500 dark:text-gray-400 ${
                isRefreshing || loading ? "animate-spin" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        )}

        {/* Settings Button */}
        {onSettings && (
          <button
            type="button"
            onClick={onSettings}
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
            aria-label="Widget settings"
          >
            <svg
              className="w-4 h-4 text-gray-500 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
