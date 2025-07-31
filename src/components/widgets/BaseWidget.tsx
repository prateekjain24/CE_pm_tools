import type { ReactNode } from "react"
import { EmptyStateIllustration } from "~/components/common/EmptyStateIllustration"
import { WidgetError } from "./WidgetError"
import { WidgetHeader } from "./WidgetHeader"
import { WidgetSkeleton } from "./WidgetSkeleton"

/**
 * Base widget props that all widgets should extend
 */
export interface BaseWidgetProps<T = unknown> {
  widgetId: string
  title: string
  icon?: ReactNode
  loading?: boolean
  error?: Error | null
  data?: T
  onRefresh?: () => Promise<void>
  onSettings?: () => void
  onHide?: () => void
  children: (data: T) => ReactNode
  className?: string
  // Widget-specific settings
  settings?: Record<string, unknown>
  emptyStateType?: "calculator" | "feed" | "analytics" | "default"
}

/**
 * Base widget component that provides consistent structure for all widgets
 * Handles loading, error, and empty states automatically
 */
export function BaseWidget<T = unknown>({
  title,
  icon,
  loading,
  error,
  data,
  onRefresh,
  onSettings,
  onHide,
  children,
  className = "",
  settings,
  emptyStateType = "default",
}: BaseWidgetProps<T>) {
  // Loading state
  if (loading && !data) {
    return <WidgetSkeleton title={title} />
  }

  // Error state
  if (error) {
    return (
      <div
        className={`widget-base bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden ${className}`}
      >
        <WidgetHeader
          title={title}
          icon={icon}
          onRefresh={onRefresh}
          onSettings={onSettings}
          onHide={onHide}
          loading={loading}
        />
        <WidgetError error={error} onRetry={onRefresh} />
      </div>
    )
  }

  // Empty state
  if (!data) {
    return (
      <div
        className={`widget-base bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden ${className}`}
      >
        <WidgetHeader
          title={title}
          icon={icon}
          onRefresh={onRefresh}
          onSettings={onSettings}
          onHide={onHide}
          loading={loading}
        />
        <div className="widget-empty p-8 text-center">
          <EmptyStateIllustration type={emptyStateType} />
          <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-1">
            No data yet
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {emptyStateType === "calculator" && "Start calculating to see results"}
            {emptyStateType === "feed" && "Feed items will appear here"}
            {emptyStateType === "analytics" && "Analytics data will be displayed here"}
            {emptyStateType === "default" && "Data will appear here once available"}
          </p>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 dark:text-primary-400 dark:bg-primary-900/20 dark:hover:bg-primary-900/30 rounded-md transition-colors"
            >
              <svg
                className="w-4 h-4 mr-1.5"
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
              Refresh
            </button>
          )}
        </div>
      </div>
    )
  }

  // Normal render with data
  return (
    <div className={`widget-base ${className}`}>
      <WidgetHeader
        title={settings?.customTitle || title}
        icon={icon}
        onRefresh={onRefresh}
        onSettings={onSettings}
        onHide={onHide}
        loading={loading}
      />
      <div className="widget-content">{children(data)}</div>
    </div>
  )
}

/**
 * Type helper for creating widget components
 */
export type WidgetComponent<T = unknown> = React.FC<
  Omit<BaseWidgetProps<T>, "children"> & {
    widgetConfig?: Record<string, unknown>
  }
>
