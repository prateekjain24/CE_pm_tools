import type { RiceScore, WidgetConfig } from "~/types"

/**
 * Storage migration system for handling schema changes
 */

/**
 * Layout storage version
 * Increment this when making breaking changes to the layout schema
 */
export const CURRENT_LAYOUT_VERSION = 1

/**
 * RICE score version
 * Version 1: Old scale with raw reach numbers, decimal impact values
 * Version 2: New 1-10 scale for all inputs
 */
export const CURRENT_RICE_VERSION = 2

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

/**
 * RICE Score Migration Functions
 */

/**
 * Map old reach values (raw numbers) to 1-10 scale
 */
function mapReachToNewScale(oldReach: number): number {
  if (oldReach <= 10) return 1
  if (oldReach <= 50) return 2
  if (oldReach <= 100) return 3
  if (oldReach <= 500) return 4
  if (oldReach <= 1000) return 5
  if (oldReach <= 2500) return 6
  if (oldReach <= 5000) return 7
  if (oldReach <= 10000) return 8
  if (oldReach <= 50000) return 9
  return 10
}

/**
 * Map old impact values (0.25-3) to 1-10 scale
 */
function mapImpactToNewScale(oldImpact: number): number {
  // Handle exact matches for old scale
  if (oldImpact === 0.25) return 2
  if (oldImpact === 0.5) return 3
  if (oldImpact === 1) return 5
  if (oldImpact === 2) return 7
  if (oldImpact === 3) return 9

  // Handle edge cases
  if (oldImpact < 0.25) return 1
  if (oldImpact > 3) return 10

  // Linear interpolation for in-between values
  if (oldImpact < 0.5) return 2
  if (oldImpact < 1) return 4
  if (oldImpact < 2) return 6
  if (oldImpact < 3) return 8
  return 9
}

/**
 * Map old effort values (person-months) to 1-10 scale
 */
function mapEffortToNewScale(oldEffort: number): number {
  if (oldEffort <= 0.25) return 1
  if (oldEffort <= 0.5) return 2
  if (oldEffort <= 1) return 3
  if (oldEffort <= 2) return 4
  if (oldEffort <= 4) return 5
  if (oldEffort <= 8) return 6
  if (oldEffort <= 12) return 7
  if (oldEffort <= 16) return 8
  if (oldEffort <= 24) return 9
  return 10
}

/**
 * Migrate RICE scores from old scale to new 1-10 scale
 */
export function migrateRiceScores(scores: any[]): RiceScore[] {
  if (!Array.isArray(scores)) return []

  return scores.map((score) => {
    // Check if already migrated (all values are 1-10 integers)
    const isMigrated =
      score.reach >= 1 &&
      score.reach <= 10 &&
      Number.isInteger(score.reach) &&
      score.impact >= 1 &&
      score.impact <= 10 &&
      Number.isInteger(score.impact) &&
      score.effort >= 1 &&
      score.effort <= 10 &&
      Number.isInteger(score.effort)

    if (isMigrated) {
      return score as RiceScore
    }

    // Migrate old scale to new scale
    const migratedScore: RiceScore = {
      ...score,
      reach: mapReachToNewScale(score.reach || 0),
      impact: mapImpactToNewScale(score.impact || 1),
      effort: mapEffortToNewScale(score.effort || 1),
      // Confidence stays the same (already 0-100)
      confidence: score.confidence,
      // Recalculate score with new values
      score:
        (mapReachToNewScale(score.reach || 0) *
          mapImpactToNewScale(score.impact || 1) *
          (score.confidence / 100)) /
        mapEffortToNewScale(score.effort || 1),
      // Add migration timestamp
      migratedAt: Date.now(),
    }

    console.log(
      `Migrated RICE score "${score.name}": reach ${score.reach}→${migratedScore.reach}, impact ${score.impact}→${migratedScore.impact}, effort ${score.effort}→${migratedScore.effort}`
    )

    return migratedScore
  })
}
