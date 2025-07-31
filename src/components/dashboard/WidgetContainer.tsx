import type { Size, WidgetConfig } from "~/types"
import { WidgetRenderer } from "./WidgetRenderer"

interface WidgetContainerProps {
  widget: WidgetConfig
  onRemove: () => void
  onResize: (newSize: Size) => void
  onSettings: () => void
}

export function WidgetContainer({ widget, onRemove, onSettings }: WidgetContainerProps) {
  const gridStyles = {
    gridColumn: `span ${widget.size.width}`,
    gridRow: `span ${widget.size.height}`,
  }

  return (
    <div
      className="widget-container group animate-scale-in"
      style={gridStyles}
      data-widget-id={widget.id}
    >
      <WidgetRenderer widget={widget} onRemove={onRemove} onSettings={onSettings} />

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
