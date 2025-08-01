import { useEffect, useMemo, useState } from "react"
import type { RiceScore } from "~/types"

interface ValidationError {
  field: keyof Omit<RiceScore, "id" | "name" | "score" | "savedAt" | "notes">
  message: string
}

interface ValidationResult {
  errors: ValidationError[]
  isValid: boolean
  warnings: string[]
}

/**
 * Custom hook for RICE input validation
 */
export function useRiceValidation(values: {
  reach: number
  impact: number
  confidence: number
  effort: number
}): ValidationResult {
  const result = useMemo<ValidationResult>(() => {
    const errors: ValidationError[] = []
    const warnings: string[] = []

    // Reach validation (1-10 scale)
    if (values.reach < 1) {
      errors.push({
        field: "reach",
        message: "Reach must be at least 1",
      })
    } else if (values.reach > 10) {
      errors.push({
        field: "reach",
        message: "Reach cannot exceed 10",
      })
    } else if (!Number.isInteger(values.reach)) {
      errors.push({
        field: "reach",
        message: "Reach must be a whole number between 1 and 10",
      })
    }

    // Impact validation (1-10 scale)
    if (values.impact < 1) {
      errors.push({
        field: "impact",
        message: "Impact must be at least 1",
      })
    } else if (values.impact > 10) {
      errors.push({
        field: "impact",
        message: "Impact cannot exceed 10",
      })
    } else if (!Number.isInteger(values.impact)) {
      errors.push({
        field: "impact",
        message: "Impact must be a whole number between 1 and 10",
      })
    }

    // Confidence validation
    if (values.confidence < 0) {
      errors.push({
        field: "confidence",
        message: "Confidence must be at least 0%",
      })
    } else if (values.confidence > 100) {
      errors.push({
        field: "confidence",
        message: "Confidence cannot exceed 100%",
      })
    } else if (values.confidence < 20) {
      warnings.push("Very low confidence - consider more research before implementing")
    } else if (values.confidence === 100) {
      warnings.push("100% confidence is rare - are you sure about this estimate?")
    }

    // Effort validation (1-10 scale)
    if (values.effort < 1) {
      errors.push({
        field: "effort",
        message: "Effort must be at least 1",
      })
    } else if (values.effort > 10) {
      errors.push({
        field: "effort",
        message: "Effort cannot exceed 10",
      })
    } else if (!Number.isInteger(values.effort)) {
      errors.push({
        field: "effort",
        message: "Effort must be a whole number between 1 and 10",
      })
    } else if (values.effort >= 8) {
      warnings.push("High effort (3+ months) - consider breaking into smaller features")
    }

    // Cross-field validations
    if (values.reach > 0 && values.impact > 0 && values.confidence > 0 && values.effort > 0) {
      const estimatedScore =
        (values.reach * values.impact * (values.confidence / 100)) / values.effort

      if (estimatedScore < 5 && values.effort > 5) {
        warnings.push("Low score with high effort - reconsider prioritization")
      } else if (estimatedScore > 50) {
        warnings.push("Very high score - double-check all inputs")
      }
    }

    // Check if all required fields have values
    const hasAllValues =
      values.reach !== undefined &&
      values.impact !== undefined &&
      values.confidence !== undefined &&
      values.effort !== undefined &&
      values.effort > 0

    const isValid = errors.length === 0 && hasAllValues

    return { errors, isValid, warnings }
  }, [values])

  return result
}

/**
 * Format validation error for display
 */
export function formatValidationError(error: ValidationError): string {
  const fieldLabels: Record<ValidationError["field"], string> = {
    reach: "Reach",
    impact: "Impact",
    confidence: "Confidence",
    effort: "Effort",
  }

  return `${fieldLabels[error.field]}: ${error.message}`
}

/**
 * Get field-specific error message
 */
export function getFieldError(
  errors: ValidationError[],
  field: ValidationError["field"]
): string | undefined {
  const error = errors.find((e) => e.field === field)
  return error?.message
}

/**
 * Validate project name
 */
export function validateProjectName(name: string): {
  isValid: boolean
  error?: string
} {
  if (!name || name.trim().length === 0) {
    return {
      isValid: false,
      error: "Project name is required",
    }
  }

  if (name.trim().length < 3) {
    return {
      isValid: false,
      error: "Project name must be at least 3 characters",
    }
  }

  if (name.length > 100) {
    return {
      isValid: false,
      error: "Project name must be less than 100 characters",
    }
  }

  return { isValid: true }
}

/**
 * Debounced validation for real-time feedback
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
