import type { ReactNode } from "react"
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
}: BaseWidgetProps<T>) {
  // Loading state
  if (loading && !data) {
    return <WidgetSkeleton title={title} />
  }

  // Error state
  if (error) {
    return (
      <div className={`widget-base ${className}`}>
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
      <div className={`widget-base ${className}`}>
        <WidgetHeader
          title={title}
          icon={icon}
          onRefresh={onRefresh}
          onSettings={onSettings}
          onHide={onHide}
          loading={loading}
        />
        <div className="widget-empty p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm">No data available</p>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="mt-4 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 underline"
            >
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
