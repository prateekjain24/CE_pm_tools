import type { WidgetConfig } from "~/types"
import { DEFAULT_WIDGET_SIZES } from "~/types"

/**
 * Generate default dashboard layout with smart positioning
 */
export function getDefaultLayout(): WidgetConfig[] {
  const defaultWidgets: WidgetConfig[] = [
    {
      id: "widget-rice-1",
      type: "rice-calculator",
      position: { x: 0, y: 0 },
      size: DEFAULT_WIDGET_SIZES["rice-calculator"],
      visible: true,
      title: "RICE Calculator",
    },
    {
      id: "widget-product-hunt-1",
      type: "product-hunt-feed",
      position: { x: 4, y: 0 },
      size: DEFAULT_WIDGET_SIZES["product-hunt-feed"],
      visible: true,
      title: "Product Hunt",
    },
    {
      id: "widget-hacker-news-1",
      type: "hacker-news-feed",
      position: { x: 8, y: 0 },
      size: DEFAULT_WIDGET_SIZES["hacker-news-feed"],
      visible: true,
      title: "Hacker News",
    },
    {
      id: "widget-tam-1",
      type: "tam-calculator",
      position: { x: 0, y: 3 },
      size: DEFAULT_WIDGET_SIZES["tam-calculator"],
      visible: true,
      title: "TAM/SAM/SOM Calculator",
    },
    {
      id: "widget-roi-1",
      type: "roi-calculator",
      position: { x: 4, y: 3 },
      size: DEFAULT_WIDGET_SIZES["roi-calculator"],
      visible: true,
      title: "ROI Calculator",
    },
  ]

  return defaultWidgets
}

/**
 * Calculate optimal widget positions based on screen size
 */
export function calculateResponsiveLayout(
  widgets: WidgetConfig[],
  screenWidth: number
): WidgetConfig[] {
  const columns = getColumnCount(screenWidth)
  let currentRow = 0
  let currentCol = 0

  return widgets.map((widget) => {
    // If widget doesn't fit in current row, move to next
    if (currentCol + widget.size.width > columns) {
      currentRow += 1
      currentCol = 0
    }

    const position = {
      x: currentCol,
      y: currentRow * 3, // Assuming each row is 3 units tall
    }

    currentCol += widget.size.width + 1 // Add gap

    return {
      ...widget,
      position,
    }
  })
}

/**
 * Get grid column count based on screen width
 */
function getColumnCount(screenWidth: number): number {
  if (screenWidth < 640) return 4 // Mobile
  if (screenWidth < 1024) return 8 // Tablet
  return 12 // Desktop
}

/**
 * Check if widget positions overlap
 */
export function hasCollision(widget1: WidgetConfig, widget2: WidgetConfig): boolean {
  const w1 = {
    left: widget1.position.x,
    right: widget1.position.x + widget1.size.width,
    top: widget1.position.y,
    bottom: widget1.position.y + widget1.size.height,
  }

  const w2 = {
    left: widget2.position.x,
    right: widget2.position.x + widget2.size.width,
    top: widget2.position.y,
    bottom: widget2.position.y + widget2.size.height,
  }

  return !(w1.right <= w2.left || w1.left >= w2.right || w1.bottom <= w2.top || w1.top >= w2.bottom)
}

/**
 * Find next available position for a widget
 */
export function findNextAvailablePosition(
  existingWidgets: WidgetConfig[],
  widgetSize: { width: number; height: number },
  maxColumns: number = 12
): { x: number; y: number } {
  let y = 0

  while (true) {
    for (let x = 0; x <= maxColumns - widgetSize.width; x++) {
      const testWidget: WidgetConfig = {
        id: "test",
        type: "custom",
        position: { x, y },
        size: widgetSize,
        visible: true,
      }

      const hasAnyCollision = existingWidgets.some((existing) => hasCollision(testWidget, existing))

      if (!hasAnyCollision) {
        return { x, y }
      }
    }
    y += 1
  }
}
