import { useEffect, useRef, useState } from "react"
import { calculateResponsiveLayout } from "~/lib/dashboard/defaultLayout"
import type { WidgetConfig } from "~/types"
import { WidgetContainer } from "./WidgetContainer"
import { WidgetSettings } from "./WidgetSettings"

interface DashboardGridProps {
  layout: WidgetConfig[]
  onLayoutChange: (layout: WidgetConfig[]) => void
  activeCalculator?: string | null
  widgetRefs?: React.MutableRefObject<{ [key: string]: HTMLElement | null }>
}

export function DashboardGrid({
  layout,
  onLayoutChange,
  activeCalculator,
  widgetRefs,
}: DashboardGridProps) {
  const gridRef = useRef<HTMLDivElement>(null)
  const [isClient, setIsClient] = useState(false)
  const [screenWidth, setScreenWidth] = useState(1200)
  const [settingsWidget, setSettingsWidget] = useState<WidgetConfig | null>(null)

  // Handle client-side rendering
  useEffect(() => {
    setIsClient(true)
    setScreenWidth(window.innerWidth)
  }, [])

  // Handle responsive layout
  useEffect(() => {
    if (!isClient) return

    const handleResize = () => {
      const newWidth = window.innerWidth
      if (Math.abs(newWidth - screenWidth) > 100) {
        setScreenWidth(newWidth)
        // Recalculate layout for new screen size
        const responsiveLayout = calculateResponsiveLayout(layout, newWidth)
        onLayoutChange(responsiveLayout)
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [layout, screenWidth, onLayoutChange, isClient])

  // Filter visible widgets
  const visibleWidgets = layout.filter((widget) => widget.visible)

  if (!isClient) {
    // Server-side render placeholder
    return (
      <div className="dashboard-grid">
        {visibleWidgets.map((widget) => (
          <div
            key={widget.id}
            className="widget-skeleton"
            style={{
              gridColumn: `span ${widget.size.width}`,
              gridRow: `span ${widget.size.height}`,
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div ref={gridRef} className="dashboard-grid animate-fade-in">
      {visibleWidgets.map((widget) => (
        <WidgetContainer
          key={widget.id}
          ref={(el) => {
            if (widgetRefs) {
              widgetRefs.current[widget.id] = el
            }
          }}
          widget={widget}
          activeCalculator={activeCalculator}
          onRemove={() => {
            // Remove widget completely
            const updatedLayout = layout.filter((w) => w.id !== widget.id)
            onLayoutChange(updatedLayout)
          }}
          onHide={() => {
            // Hide widget (keep in layout but not visible)
            const updatedLayout = layout.map((w) =>
              w.id === widget.id ? { ...w, visible: false } : w
            )
            onLayoutChange(updatedLayout)
          }}
          onResize={(newSize) => {
            // Update widget size
            const updatedLayout = layout.map((w) =>
              w.id === widget.id ? { ...w, size: newSize } : w
            )
            onLayoutChange(updatedLayout)
          }}
          onSettings={() => {
            setSettingsWidget(widget)
          }}
        />
      ))}

      {/* Grid overlay for debugging (only in development) */}
      {process.env.NODE_ENV === "development" && (
        <div className="absolute inset-0 pointer-events-none opacity-10">
          <div className="dashboard-grid h-full">
            {Array.from({ length: 48 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: Grid cells are static
              <div key={i} className="border border-dashed border-gray-400 dark:border-gray-600" />
            ))}
          </div>
        </div>
      )}

      {/* Widget Settings Modal */}
      {settingsWidget && (
        <WidgetSettings
          widget={settingsWidget}
          open={!!settingsWidget}
          onClose={() => setSettingsWidget(null)}
          onSave={(settings) => {
            // Update widget settings
            const updatedLayout = layout.map((w) =>
              w.id === settingsWidget.id ? { ...w, settings } : w
            )
            onLayoutChange(updatedLayout)
          }}
        />
      )}
    </div>
  )
}
