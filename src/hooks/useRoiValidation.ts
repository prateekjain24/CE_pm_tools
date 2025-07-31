import { useMemo } from "react"
import type { LineItem } from "~/types"

interface ValidationError {
  field: string
  message: string
}

interface ValidationWarning {
  field: string
  message: string
}

interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  suggestions: string[]
}

/**
 * Hook for validating ROI calculation inputs
 */
export function useRoiValidation(
  projectName: string,
  initialCost: number,
  costs: LineItem[],
  benefits: LineItem[],
  timeHorizon: number,
  discountRate: number
): ValidationResult {
  const errors = useMemo<ValidationError[]>(() => {
    const validationErrors: ValidationError[] = []

    // Project name validation
    if (!projectName.trim()) {
      validationErrors.push({
        field: "projectName",
        message: "Project name is required",
      })
    }

    // Initial cost validation
    if (initialCost < 0) {
      validationErrors.push({
        field: "initialCost",
        message: "Initial cost cannot be negative",
      })
    }

    // Time horizon validation
    if (timeHorizon < 1) {
      validationErrors.push({
        field: "timeHorizon",
        message: "Time horizon must be at least 1 month",
      })
    } else if (timeHorizon > 120) {
      validationErrors.push({
        field: "timeHorizon",
        message: "Time horizon cannot exceed 120 months (10 years)",
      })
    }

    // Discount rate validation
    if (discountRate < 0) {
      validationErrors.push({
        field: "discountRate",
        message: "Discount rate cannot be negative",
      })
    } else if (discountRate > 50) {
      validationErrors.push({
        field: "discountRate",
        message: "Discount rate seems too high (max 50%)",
      })
    }

    // Cost validation
    costs.forEach((cost, index) => {
      if (!cost.description.trim()) {
        validationErrors.push({
          field: `cost-${index}-description`,
          message: `Cost #${index + 1} needs a description`,
        })
      }
      if (cost.amount < 0) {
        validationErrors.push({
          field: `cost-${index}-amount`,
          message: `Cost #${index + 1} amount cannot be negative`,
        })
      }
      if (cost.startMonth < 1 || cost.startMonth > timeHorizon) {
        validationErrors.push({
          field: `cost-${index}-startMonth`,
          message: `Cost #${index + 1} start month must be within 1-${timeHorizon}`,
        })
      }
      if (cost.months < 1) {
        validationErrors.push({
          field: `cost-${index}-months`,
          message: `Cost #${index + 1} duration must be at least 1 month`,
        })
      }
      if (cost.startMonth + cost.months - 1 > timeHorizon) {
        validationErrors.push({
          field: `cost-${index}-duration`,
          message: `Cost #${index + 1} extends beyond time horizon`,
        })
      }
    })

    // Benefit validation
    benefits.forEach((benefit, index) => {
      if (!benefit.description.trim()) {
        validationErrors.push({
          field: `benefit-${index}-description`,
          message: `Benefit #${index + 1} needs a description`,
        })
      }
      if (benefit.amount < 0) {
        validationErrors.push({
          field: `benefit-${index}-amount`,
          message: `Benefit #${index + 1} amount cannot be negative`,
        })
      }
      if (benefit.startMonth < 1 || benefit.startMonth > timeHorizon) {
        validationErrors.push({
          field: `benefit-${index}-startMonth`,
          message: `Benefit #${index + 1} start month must be within 1-${timeHorizon}`,
        })
      }
      if (benefit.months < 1) {
        validationErrors.push({
          field: `benefit-${index}-months`,
          message: `Benefit #${index + 1} duration must be at least 1 month`,
        })
      }
      if (benefit.startMonth + benefit.months - 1 > timeHorizon) {
        validationErrors.push({
          field: `benefit-${index}-duration`,
          message: `Benefit #${index + 1} extends beyond time horizon`,
        })
      }
      if (benefit.probability !== undefined) {
        if (benefit.probability < 0 || benefit.probability > 100) {
          validationErrors.push({
            field: `benefit-${index}-probability`,
            message: `Benefit #${index + 1} probability must be 0-100%`,
          })
        }
      }
    })

    return validationErrors
  }, [projectName, initialCost, costs, benefits, timeHorizon, discountRate])

  const warnings = useMemo<ValidationWarning[]>(() => {
    const validationWarnings: ValidationWarning[] = []

    // High discount rate warning
    if (discountRate > 20) {
      validationWarnings.push({
        field: "discountRate",
        message: "Discount rate seems high. Typical rates are 8-15%",
      })
    }

    // Short time horizon warning
    if (timeHorizon < 12 && (costs.length > 0 || benefits.length > 0)) {
      validationWarnings.push({
        field: "timeHorizon",
        message: "Consider a longer time horizon (12+ months) for more accurate ROI",
      })
    }

    // No benefits warning
    if (benefits.length === 0 && (initialCost > 0 || costs.length > 0)) {
      validationWarnings.push({
        field: "benefits",
        message: "No benefits defined - ROI will be negative",
      })
    }

    // Low probability warnings
    benefits.forEach((benefit, index) => {
      if (benefit.probability && benefit.probability < 50) {
        validationWarnings.push({
          field: `benefit-${index}-probability`,
          message: `Benefit #${index + 1} has low probability (${benefit.probability}%)`,
        })
      }
    })

    // Large initial investment warning
    const totalCosts =
      initialCost +
      costs.reduce(
        (sum, cost) => sum + (cost.isRecurring ? cost.amount * cost.months : cost.amount),
        0
      )
    const totalBenefits = benefits.reduce((sum, benefit) => {
      const probability = (benefit.probability ?? 100) / 100
      return (
        sum + (benefit.isRecurring ? benefit.amount * benefit.months : benefit.amount) * probability
      )
    }, 0)

    if (initialCost > totalCosts * 0.5) {
      validationWarnings.push({
        field: "initialCost",
        message: "Initial investment is more than 50% of total costs",
      })
    }

    if (totalBenefits < totalCosts * 0.8) {
      validationWarnings.push({
        field: "general",
        message: "Total benefits are less than 80% of total costs - ROI may be negative",
      })
    }

    return validationWarnings
  }, [initialCost, costs, benefits, timeHorizon, discountRate])

  const suggestions = useMemo<string[]>(() => {
    const validationSuggestions: string[] = []

    // Suggestions based on current inputs
    if (costs.length === 0 && initialCost === 0) {
      validationSuggestions.push("Add initial investment or recurring costs to calculate ROI")
    }

    if (benefits.length === 0) {
      validationSuggestions.push("Add expected benefits (revenue, cost savings) to see ROI")
    }

    // Time-based suggestions
    const hasLongTermItems = [...costs, ...benefits].some((item) => item.months > 24)
    if (hasLongTermItems && timeHorizon < 36) {
      validationSuggestions.push(
        "Consider extending time horizon to capture all long-term benefits"
      )
    }

    // Risk suggestions
    const hasUncertainBenefits = benefits.some((b) => b.probability && b.probability < 80)
    if (hasUncertainBenefits) {
      validationSuggestions.push("Consider creating multiple scenarios to account for uncertainty")
    }

    // Category suggestions
    const costCategories = new Set(costs.map((c) => c.category))
    const benefitCategories = new Set(benefits.map((b) => b.category))

    if (costCategories.size === 1 && costs.length > 3) {
      validationSuggestions.push(
        "Consider categorizing costs more specifically for better analysis"
      )
    }

    if (!benefitCategories.has("cost_savings") && costs.length > 0) {
      validationSuggestions.push(
        "Don't forget to include cost savings as benefits (e.g., reduced manual work)"
      )
    }

    return validationSuggestions
  }, [initialCost, costs, benefits, timeHorizon])

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions,
  }
}

/**
 * Get field-specific validation error
 */
export function getFieldError(errors: ValidationError[], fieldName: string): string | undefined {
  const error = errors.find((e) => e.field === fieldName)
  return error?.message
}

/**
 * Validate project name
 */
export function validateProjectName(name: string): string | undefined {
  if (!name.trim()) {
    return "Project name is required"
  }
  if (name.length > 100) {
    return "Project name is too long (max 100 characters)"
  }
  return undefined
}
