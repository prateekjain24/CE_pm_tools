import { useStorage } from "@plasmohq/storage/hook"
import { useCallback, useEffect, useRef } from "react"
import {
  findNextAvailablePosition,
  getDefaultLayout,
  hasCollision,
} from "~/lib/dashboard/defaultLayout"
import { validateLayout } from "~/lib/storage/layoutValidator"
import {
  extractWidgets,
  migrateLayout,
  prepareLayoutForStorage,
  type VersionedLayout,
} from "~/lib/storage/migrations"
import { hasStorageSpace } from "~/lib/storage/storageManager"
import type { Size, WidgetConfig } from "~/types"
import { DEFAULT_WIDGET_SIZES } from "~/types"

interface UseDashboardLayoutReturn {
  layout: WidgetConfig[]
  updateWidget: (widgetId: string, updates: Partial<WidgetConfig>) => void
  addWidget: (type: WidgetConfig["type"], customConfig?: Partial<WidgetConfig>) => void
  removeWidget: (widgetId: string) => void
  hideWidget: (widgetId: string) => void
  showWidget: (widgetId: string) => void
  moveWidget: (widgetId: string, newPosition: { x: number; y: number }) => void
  resizeWidget: (widgetId: string, newSize: Size) => void
  resetLayout: () => void
  isLoading: boolean
}

/**
 * Custom hook for managing dashboard layout with persistence
 */
export function useDashboardLayout(): UseDashboardLayoutReturn {
  const [rawLayout, setRawLayout, { isLoading }] = useStorage<VersionedLayout | WidgetConfig[]>(
    "dashboard-layout",
    prepareLayoutForStorage(getDefaultLayout())
  )

  // Extract widgets from versioned or legacy layout
  const layout = extractWidgets(rawLayout)

  // Debounce timer for layout updates
  const updateTimerRef = useRef<NodeJS.Timeout>()

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current)
      }
    }
  }, [])

  /**
   * Debounced layout update to prevent excessive storage writes
   */
  const debouncedSetLayout = useCallback(
    async (newLayout: WidgetConfig[]) => {
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current)
      }

      updateTimerRef.current = setTimeout(async () => {
        // Validate layout before saving
        const validation = validateLayout(newLayout)
        if (!validation.valid) {
          console.error("Layout validation failed:", validation.errors)
          return
        }

        const sanitizedLayout = validation.sanitizedLayout || newLayout
        const versionedLayout = prepareLayoutForStorage(sanitizedLayout)

        // Check storage space
        const { hasSpace, reason } = await hasStorageSpace("dashboard-layout", versionedLayout)
        if (!hasSpace) {
          console.error("Not enough storage space:", reason)
          // TODO: Show user notification
          return
        }

        setRawLayout(versionedLayout)
      }, 500) // 500ms debounce
    },
    [setRawLayout]
  )

  /**
   * Update a specific widget's properties
   */
  const updateWidget = useCallback(
    (widgetId: string, updates: Partial<WidgetConfig>) => {
      const newLayout = layout.map((widget) =>
        widget.id === widgetId ? { ...widget, ...updates } : widget
      )
      debouncedSetLayout(newLayout)
    },
    [layout, debouncedSetLayout]
  )

  /**
   * Add a new widget to the dashboard
   */
  const addWidget = useCallback(
    (type: WidgetConfig["type"], customConfig?: Partial<WidgetConfig>) => {
      const widgetDef = DEFAULT_WIDGET_SIZES[type]
      const position = findNextAvailablePosition(layout, widgetDef)

      const newWidget: WidgetConfig = {
        id: `widget-${type}-${Date.now()}`,
        type,
        position,
        size: widgetDef,
        visible: true,
        ...customConfig,
      }

      const newLayout = [...layout, newWidget]
      debouncedSetLayout(newLayout)
    },
    [layout, debouncedSetLayout]
  )

  /**
   * Remove a widget from the dashboard
   */
  const removeWidget = useCallback(
    (widgetId: string) => {
      const newLayout = layout.filter((widget) => widget.id !== widgetId)
      debouncedSetLayout(newLayout)
    },
    [layout, debouncedSetLayout]
  )

  /**
   * Hide a widget (keep in layout but not visible)
   */
  const hideWidget = useCallback(
    (widgetId: string) => {
      updateWidget(widgetId, { visible: false })
    },
    [updateWidget]
  )

  /**
   * Show a hidden widget
   */
  const showWidget = useCallback(
    (widgetId: string) => {
      updateWidget(widgetId, { visible: true })
    },
    [updateWidget]
  )

  /**
   * Move a widget to a new position
   */
  const moveWidget = useCallback(
    (widgetId: string, newPosition: { x: number; y: number }) => {
      const widget = layout.find((w) => w.id === widgetId)
      if (!widget) return

      // Check for collisions with other widgets
      const testWidget = { ...widget, position: newPosition }
      const otherWidgets = layout.filter((w) => w.id !== widgetId)

      const hasAnyCollision = otherWidgets.some((other) => hasCollision(testWidget, other))

      if (!hasAnyCollision) {
        updateWidget(widgetId, { position: newPosition })
      }
    },
    [layout, updateWidget]
  )

  /**
   * Resize a widget
   */
  const resizeWidget = useCallback(
    (widgetId: string, newSize: Size) => {
      const widget = layout.find((w) => w.id === widgetId)
      if (!widget) return

      // Check size constraints
      const _widgetDef = DEFAULT_WIDGET_SIZES[widget.type]
      const constrainedSize = {
        width: Math.max(2, Math.min(6, newSize.width)),
        height: Math.max(2, Math.min(6, newSize.height)),
      }

      updateWidget(widgetId, { size: constrainedSize })
    },
    [layout, updateWidget]
  )

  /**
   * Reset layout to default
   */
  const resetLayout = useCallback(() => {
    const defaultLayout = getDefaultLayout()
    const versionedLayout = prepareLayoutForStorage(defaultLayout)
    setRawLayout(versionedLayout)
  }, [setRawLayout])

  // Migrate layout on first load
  useEffect(() => {
    if (!isLoading && rawLayout) {
      const migrated = migrateLayout(rawLayout)
      if (migrated.version !== (rawLayout as any).version) {
        setRawLayout(migrated)
      }
    }
  }, [rawLayout, setRawLayout, isLoading])

  return {
    layout: layout || [],
    updateWidget,
    addWidget,
    removeWidget,
    hideWidget,
    showWidget,
    moveWidget,
    resizeWidget,
    resetLayout,
    isLoading,
  }
}
