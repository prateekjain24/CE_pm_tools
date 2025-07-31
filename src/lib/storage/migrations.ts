import type { WidgetConfig } from "~/types"

/**
 * Storage migration system for handling schema changes
 */

/**
 * Layout storage version
 * Increment this when making breaking changes to the layout schema
 */
export const CURRENT_LAYOUT_VERSION = 1

/**
 * Layout storage schema with version
 */
export interface VersionedLayout {
  version: number
  widgets: WidgetConfig[]
  migratedAt?: number
}

/**
 * Migration function type
 */
type MigrationFunction = (data: any) => VersionedLayout

/**
 * Registry of migration functions
 * Key is the version to migrate FROM
 */
const migrations: Record<number, MigrationFunction> = {
  // Migration from version 0 (no version) to version 1
  0: (data: any): VersionedLayout => {
    // Handle legacy layouts without version
    if (Array.isArray(data)) {
      return {
        version: 1,
        widgets: data as WidgetConfig[],
        migratedAt: Date.now(),
      }
    }

    // If it's already an object with widgets array
    if (data && typeof data === "object" && Array.isArray(data.widgets)) {
      return {
        version: 1,
        widgets: data.widgets,
        migratedAt: Date.now(),
      }
    }

    // Default to empty layout
    return {
      version: 1,
      widgets: [],
      migratedAt: Date.now(),
    }
  },

  // Future migrations would be added here
  // 1: (data: any): VersionedLayout => { ... }
}

/**
 * Migrate layout data to current version
 */
export function migrateLayout(data: any): VersionedLayout {
  // If data is null/undefined, return empty layout
  if (!data) {
    return {
      version: CURRENT_LAYOUT_VERSION,
      widgets: [],
    }
  }

  // Determine current version
  let currentVersion = 0
  let currentData = data

  // Check if data has version property
  if (typeof data === "object" && "version" in data) {
    currentVersion = data.version || 0
    currentData = data
  }

  // If already at current version, return as-is
  if (currentVersion === CURRENT_LAYOUT_VERSION && isVersionedLayout(currentData)) {
    return currentData
  }

  // Apply migrations sequentially
  let migratedData = currentData
  for (let v = currentVersion; v < CURRENT_LAYOUT_VERSION; v++) {
    const migrationFn = migrations[v]
    if (migrationFn) {
      console.log(`Migrating layout from version ${v} to ${v + 1}`)
      migratedData = migrationFn(migratedData)
    }
  }

  return migratedData as VersionedLayout
}

/**
 * Type guard for VersionedLayout
 */
export function isVersionedLayout(data: any): data is VersionedLayout {
  return (
    data &&
    typeof data === "object" &&
    typeof data.version === "number" &&
    Array.isArray(data.widgets)
  )
}

/**
 * Extract widgets array from versioned or legacy layout
 */
export function extractWidgets(data: any): WidgetConfig[] {
  // If it's already an array of widgets
  if (Array.isArray(data)) {
    return data
  }

  // If it's a versioned layout
  if (isVersionedLayout(data)) {
    return data.widgets
  }

  // If it has a widgets property
  if (data && typeof data === "object" && Array.isArray(data.widgets)) {
    return data.widgets
  }

  // Default to empty array
  return []
}

/**
 * Prepare layout for storage
 */
export function prepareLayoutForStorage(widgets: WidgetConfig[]): VersionedLayout {
  return {
    version: CURRENT_LAYOUT_VERSION,
    widgets,
  }
}

/**
 * Migration utilities for specific schema changes
 */
export const MigrationUtils = {
  /**
   * Add default values to widgets missing required properties
   */
  ensureRequiredProperties(widgets: WidgetConfig[]): WidgetConfig[] {
    return widgets.map((widget) => ({
      ...widget,
      visible: widget.visible !== undefined ? widget.visible : true,
      settings: widget.settings || {},
      title: widget.title || undefined,
    }))
  },

  /**
   * Fix invalid widget positions
   */
  fixInvalidPositions(widgets: WidgetConfig[]): WidgetConfig[] {
    return widgets.map((widget) => ({
      ...widget,
      position: {
        x: Math.max(0, widget.position.x),
        y: Math.max(0, widget.position.y),
      },
    }))
  },

  /**
   * Remove duplicate widgets
   */
  removeDuplicates(widgets: WidgetConfig[]): WidgetConfig[] {
    const seen = new Set<string>()
    return widgets.filter((widget) => {
      if (seen.has(widget.id)) {
        console.warn(`Removing duplicate widget: ${widget.id}`)
        return false
      }
      seen.add(widget.id)
      return true
    })
  },
}
