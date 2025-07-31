import "~/styles/globals.css"
import { useState } from "react"
import { DashboardGrid } from "~/components/dashboard/DashboardGrid"
import { EmptyState } from "~/components/dashboard/EmptyState"
import { HiddenWidgetsDrawer } from "~/components/dashboard/HiddenWidgetsDrawer"
import { DashboardHeader } from "~/components/layout/DashboardHeader"
import { useDashboardLayout } from "~/hooks/useDashboardLayout"
import type { WidgetConfig } from "~/types"

export default function NewTab() {
  const { layout, updateWidget, showWidget } = useDashboardLayout()
  const [showHiddenDrawer, setShowHiddenDrawer] = useState(false)

  const handleLayoutChange = (newLayout: WidgetConfig[]) => {
    // For now, we'll update widgets individually
    // This will be improved when we implement drag-and-drop
    newLayout.forEach((widget) => {
      const existing = layout.find((w) => w.id === widget.id)
      if (existing && JSON.stringify(existing) !== JSON.stringify(widget)) {
        updateWidget(widget.id, widget)
      }
    })
  }

  const handleRestoreWidget = (widgetId: string) => {
    showWidget(widgetId)
    setShowHiddenDrawer(false)
  }

  // Count hidden widgets
  const hiddenWidgetCount = layout.filter((w) => !w.visible).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Subtle background pattern */}
      <div
        className="fixed inset-0 opacity-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239CA3AF' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10">
        <DashboardHeader
          onShowHiddenWidgets={() => setShowHiddenDrawer(true)}
          hiddenWidgetCount={hiddenWidgetCount}
        />

        <main className="container mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          {layout && layout.length > 0 ? (
            <DashboardGrid layout={layout} onLayoutChange={handleLayoutChange} />
          ) : (
            <EmptyState />
          )}
        </main>
      </div>

      {/* Hidden Widgets Drawer */}
      <HiddenWidgetsDrawer
        layout={layout}
        onRestore={handleRestoreWidget}
        onClose={() => setShowHiddenDrawer(false)}
        open={showHiddenDrawer}
      />

      {/* Gradient overlay for depth */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/50 to-transparent dark:from-black/20" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white/50 to-transparent dark:from-black/20" />
      </div>
    </div>
  )
}
