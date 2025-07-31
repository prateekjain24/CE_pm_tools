import { Suspense } from "react"
import { widgetRegistry } from "~/lib/dashboard/widgetRegistry"
import type { WidgetConfig } from "~/types"
import { WidgetErrorBoundary } from "../widgets/WidgetErrorBoundary"
import { WidgetSkeleton } from "../widgets/WidgetSkeleton"

interface WidgetRendererProps {
  widget: WidgetConfig
  onRemove: () => void
  onSettings: () => void
  onHide: () => void
}

/**
 * Dynamically renders widgets based on their type
 * Handles lazy loading, error boundaries, and suspense
 */
export function WidgetRenderer({ widget, onRemove, onSettings, onHide }: WidgetRendererProps) {
  // Get widget definition from registry
  const widgetDefinition = widgetRegistry.get(widget.type)

  if (!widgetDefinition) {
    return (
      <div className="widget-error p-4 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Unknown widget type: {widget.type}
        </p>
      </div>
    )
  }

  if (!widgetDefinition.component) {
    return (
      <div className="widget-error p-4 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Widget component not found: {widget.type}
        </p>
      </div>
    )
  }

  // Get the lazy component
  const WidgetComponent = widgetDefinition.component

  return (
    <WidgetErrorBoundary
      widgetId={widget.id}
      onError={(error, widgetId) => {
        console.error(`Widget ${widgetId} crashed:`, error)
      }}
    >
      <Suspense
        fallback={
          <WidgetSkeleton
            title={widget.title || widgetDefinition.name}
            lines={widgetDefinition.category === "feed" ? 4 : 3}
            variant={
              widgetDefinition.category === "calculator"
                ? "calculator"
                : widgetDefinition.category === "feed"
                  ? "feed"
                  : "default"
            }
          />
        }
      >
        <WidgetComponent
          widgetId={widget.id}
          widgetConfig={{
            ...widget.settings,
            customTitle: widget.title,
            onRemove,
            onSettings,
            onHide,
          }}
        />
      </Suspense>
    </WidgetErrorBoundary>
  )
}
