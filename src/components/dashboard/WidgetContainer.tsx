import { useState } from "react"
import { widgetRegistry } from "~/lib/dashboard/widgetRegistry"
import type { Size, WidgetConfig } from "~/types"

interface WidgetContainerProps {
  widget: WidgetConfig
  onRemove: () => void
  onResize: (newSize: Size) => void
  onSettings: () => void
}

export function WidgetContainer({ widget, onRemove, onSettings }: WidgetContainerProps) {
  const [isLoading, _setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Get widget component from registry (placeholder for now)
  const widgetDefinition = widgetRegistry.get(widget.type)

  // Widget actions menu
  const [_showActions, _setShowActions] = useState(false)

  const gridStyles = {
    gridColumn: `span ${widget.size.width}`,
    gridRow: `span ${widget.size.height}`,
  }

  // Error state
  if (error) {
    return (
      <div className="widget-container" style={gridStyles}>
        <div className="widget-error p-4">
          <svg
            className="w-6 h-6 mb-2 mx-auto"
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
          <p>Failed to load widget</p>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-xs mt-2 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="widget-skeleton" style={gridStyles}>
        <div className="p-4">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-3" />
          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2" />
        </div>
      </div>
    )
  }

  return (
    <div
      className="widget-container group animate-scale-in"
      style={gridStyles}
      data-widget-id={widget.id}
    >
      {/* Widget Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-700/50">
        <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
          {widget.title || widgetDefinition?.name || "Widget"}
        </h3>

        {/* Widget Actions */}
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Settings Button */}
          <button
            type="button"
            onClick={onSettings}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
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

          {/* Minimize Button */}
          <button
            type="button"
            onClick={onRemove}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
            aria-label="Hide widget"
          >
            <svg
              className="w-4 h-4 text-gray-500 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Widget Content */}
      <div className="p-4 h-[calc(100%-48px)] overflow-auto custom-scrollbar">
        {/* Placeholder content based on widget type */}
        {renderWidgetContent(widget)}
      </div>

      {/* Drag Handle (will be functional with @dnd-kit) */}
      <div className="drag-handle">
        <svg
          className="w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </div>
    </div>
  )
}

// Temporary placeholder content renderer
function renderWidgetContent(widget: WidgetConfig) {
  switch (widget.type) {
    case "rice-calculator":
      return (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p className="mb-3">Calculate RICE scores for feature prioritization</p>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Reach:</span>
              <span className="font-medium">---</span>
            </div>
            <div className="flex justify-between">
              <span>Impact:</span>
              <span className="font-medium">---</span>
            </div>
            <div className="flex justify-between">
              <span>Confidence:</span>
              <span className="font-medium">---</span>
            </div>
            <div className="flex justify-between">
              <span>Effort:</span>
              <span className="font-medium">---</span>
            </div>
          </div>
        </div>
      )

    case "product-hunt-feed":
      return (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="pb-3 border-b border-gray-100 dark:border-gray-700/50 last:border-0"
            >
              <h4 className="font-medium text-sm mb-1">Product {i}</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Innovative solution for modern teams
              </p>
              <div className="flex items-center space-x-3 mt-2 text-xs text-gray-400">
                <span>▲ {100 - i * 10}</span>
                <span>💬 {20 - i * 3}</span>
              </div>
            </div>
          ))}
        </div>
      )

    case "hacker-news-feed":
      return (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="pb-3 border-b border-gray-100 dark:border-gray-700/50 last:border-0"
            >
              <h4 className="font-medium text-sm mb-1">Tech News Story {i}</h4>
              <div className="flex items-center space-x-3 text-xs text-gray-400">
                <span>{300 - i * 50} points</span>
                <span>{50 - i * 10} comments</span>
                <span>2h ago</span>
              </div>
            </div>
          ))}
        </div>
      )

    default:
      return (
        <div className="flex items-center justify-center h-full text-gray-400">
          <p className="text-sm">{widget.type} widget</p>
        </div>
      )
  }
}
