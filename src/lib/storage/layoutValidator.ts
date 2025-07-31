import { hasCollision } from "~/lib/dashboard/defaultLayout"
import type { WidgetConfig } from "~/types"
import { DEFAULT_WIDGET_SIZES } from "~/types"

/**
 * Layout validation errors
 */
export interface ValidationError {
  widgetId?: string
  field?: string
  message: string
  severity: "error" | "warning"
}

/**
 * Layout validation result
 */
export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
  sanitizedLayout?: WidgetConfig[]
}

/**
 * Validate and sanitize a dashboard layout
 */
export function validateLayout(widgets: WidgetConfig[]): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []
  const sanitizedWidgets: WidgetConfig[] = []

  // Check for empty layout
  if (!widgets || widgets.length === 0) {
    return {
      valid: true,
      errors: [],
      warnings: [],
      sanitizedLayout: [],
    }
  }

  // Validate each widget
  for (const widget of widgets) {
    const widgetErrors = validateWidget(widget)

    if (widgetErrors.length > 0) {
      errors.push(...widgetErrors)
      continue
    }

    // Check for widget type validity
    if (!DEFAULT_WIDGET_SIZES[widget.type]) {
      warnings.push({
        widgetId: widget.id,
        field: "type",
        message: `Unknown widget type: ${widget.type}`,
        severity: "warning",
      })
    }

    // Sanitize widget
    const sanitized = sanitizeWidget(widget)
    sanitizedWidgets.push(sanitized)
  }

  // Check for overlapping widgets
  const collisions = checkCollisions(sanitizedWidgets)
  if (collisions.length > 0) {
    errors.push(...collisions)
  }

  // Check for duplicate IDs
  const duplicates = checkDuplicateIds(sanitizedWidgets)
  if (duplicates.length > 0) {
    errors.push(...duplicates)
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    sanitizedLayout: errors.length === 0 ? sanitizedWidgets : undefined,
  }
}

/**
 * Validate individual widget
 */
function validateWidget(widget: any): ValidationError[] {
  const errors: ValidationError[] = []

  // Check required fields
  if (!widget.id || typeof widget.id !== "string") {
    errors.push({
      widgetId: widget.id,
      field: "id",
      message: "Widget must have a valid ID",
      severity: "error",
    })
  }

  if (!widget.type || typeof widget.type !== "string") {
    errors.push({
      widgetId: widget.id,
      field: "type",
      message: "Widget must have a valid type",
      severity: "error",
    })
  }

  // Validate position
  if (!widget.position || typeof widget.position !== "object") {
    errors.push({
      widgetId: widget.id,
      field: "position",
      message: "Widget must have a valid position",
      severity: "error",
    })
  } else {
    if (typeof widget.position.x !== "number" || widget.position.x < 0) {
      errors.push({
        widgetId: widget.id,
        field: "position.x",
        message: "Widget position.x must be a non-negative number",
        severity: "error",
      })
    }
    if (typeof widget.position.y !== "number" || widget.position.y < 0) {
      errors.push({
        widgetId: widget.id,
        field: "position.y",
        message: "Widget position.y must be a non-negative number",
        severity: "error",
      })
    }
  }

  // Validate size
  if (!widget.size || typeof widget.size !== "object") {
    errors.push({
      widgetId: widget.id,
      field: "size",
      message: "Widget must have a valid size",
      severity: "error",
    })
  } else {
    if (typeof widget.size.width !== "number" || widget.size.width < 1 || widget.size.width > 12) {
      errors.push({
        widgetId: widget.id,
        field: "size.width",
        message: "Widget width must be between 1 and 12",
        severity: "error",
      })
    }
    if (
      typeof widget.size.height !== "number" ||
      widget.size.height < 1 ||
      widget.size.height > 12
    ) {
      errors.push({
        widgetId: widget.id,
        field: "size.height",
        message: "Widget height must be between 1 and 12",
        severity: "error",
      })
    }
  }

  return errors
}

/**
 * Sanitize widget data
 */
function sanitizeWidget(widget: WidgetConfig): WidgetConfig {
  return {
    id: widget.id,
    type: widget.type,
    position: {
      x: Math.max(0, Math.floor(widget.position.x)),
      y: Math.max(0, Math.floor(widget.position.y)),
    },
    size: {
      width: Math.max(1, Math.min(12, Math.floor(widget.size.width))),
      height: Math.max(1, Math.min(12, Math.floor(widget.size.height))),
    },
    visible: widget.visible !== false,
    settings: widget.settings || {},
    title: widget.title || undefined,
  }
}

/**
 * Check for widget collisions
 */
function checkCollisions(widgets: WidgetConfig[]): ValidationError[] {
  const errors: ValidationError[] = []
  const visibleWidgets = widgets.filter((w) => w.visible)

  for (let i = 0; i < visibleWidgets.length; i++) {
    for (let j = i + 1; j < visibleWidgets.length; j++) {
      if (hasCollision(visibleWidgets[i], visibleWidgets[j])) {
        errors.push({
          widgetId: visibleWidgets[i].id,
          message: `Widget overlaps with widget ${visibleWidgets[j].id}`,
          severity: "error",
        })
      }
    }
  }

  return errors
}

/**
 * Check for duplicate widget IDs
 */
function checkDuplicateIds(widgets: WidgetConfig[]): ValidationError[] {
  const errors: ValidationError[] = []
  const idCounts = new Map<string, number>()

  for (const widget of widgets) {
    const count = (idCounts.get(widget.id) || 0) + 1
    idCounts.set(widget.id, count)
  }

  for (const [id, count] of idCounts) {
    if (count > 1) {
      errors.push({
        widgetId: id,
        field: "id",
        message: `Duplicate widget ID found: ${id} (${count} instances)`,
        severity: "error",
      })
    }
  }

  return errors
}

/**
 * Check if widget position is within grid bounds
 */
export function isWithinBounds(widget: WidgetConfig, gridColumns = 12, gridRows = 100): boolean {
  return (
    widget.position.x >= 0 &&
    widget.position.y >= 0 &&
    widget.position.x + widget.size.width <= gridColumns &&
    widget.position.y + widget.size.height <= gridRows
  )
}

/**
 * Fix widget positions to ensure they're within bounds
 */
export function fixOutOfBoundsWidgets(widgets: WidgetConfig[], gridColumns = 12): WidgetConfig[] {
  return widgets.map((widget) => {
    const newWidget = { ...widget }

    // Fix X position
    if (widget.position.x + widget.size.width > gridColumns) {
      newWidget.position = {
        ...widget.position,
        x: Math.max(0, gridColumns - widget.size.width),
      }
    }

    return newWidget
  })
}
