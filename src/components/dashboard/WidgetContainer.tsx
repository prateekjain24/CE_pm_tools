import { forwardRef } from "react"
import type { Size, WidgetConfig } from "~/types"
import { WidgetRenderer } from "./WidgetRenderer"

interface WidgetContainerProps {
  widget: WidgetConfig
  onRemove: () => void
  onResize: (newSize: Size) => void
  onSettings: () => void
  onHide: () => void
}

export const WidgetContainer = forwardRef<HTMLDivElement, WidgetContainerProps>(
  ({ widget, onRemove, onSettings, onHide }, ref) => {
    const gridStyles = {
      gridColumn: `span ${widget.size.width}`,
      gridRow: `span ${widget.size.height}`,
    }

    return (
      <div
        ref={ref}
        className="widget-container relative group animate-scale-in"
        style={gridStyles}
        data-widget-id={widget.id}
      >
        <WidgetRenderer
          widget={widget}
          onRemove={onRemove}
          onSettings={onSettings}
          onHide={onHide}
        />

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
)

WidgetContainer.displayName = "WidgetContainer"
