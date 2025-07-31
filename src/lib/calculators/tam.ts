import type { Currency, MarketCalculationParams, MarketSegment, MarketSizes } from "~/types"

/**
 * Calculate top-down market sizing
 * TAM → SAM (% of TAM) → SOM (% of SAM)
 */
export function calculateTopDown(params: {
  tam: number
  samPercentage: number
  somPercentage: number
  marketParams: MarketCalculationParams
}): MarketSizes {
  const { tam, samPercentage, somPercentage, marketParams } = params

  // Validate inputs
  if (tam <= 0) {
    throw new Error("TAM must be greater than 0")
  }
  if (samPercentage < 0 || samPercentage > 100) {
    throw new Error("SAM percentage must be between 0 and 100")
  }
  if (somPercentage < 0 || somPercentage > 100) {
    throw new Error("SOM percentage must be between 0 and 100")
  }

  const sam = tam * (samPercentage / 100)
  const som = sam * (somPercentage / 100)

  // Validate logical consistency
  if (sam > tam) {
    throw new Error("SAM cannot exceed TAM")
  }
  if (som > sam) {
    throw new Error("SOM cannot exceed SAM")
  }

  // Adjust for time period
  const periodAdjustedSizes = adjustForTimePeriod({ tam, sam, som }, marketParams.timePeriod)

  return {
    ...periodAdjustedSizes,
    method: "topDown",
    assumptions: [
      `Market defined as ${marketParams.geographicScope} scope`,
      `${marketParams.marketMaturity} market maturity level`,
      `SAM represents ${samPercentage}% of total market`,
      `SOM represents ${somPercentage}% of serviceable market`,
    ],
    confidence: calculateConfidence(marketParams),
  }
}

/**
 * Calculate bottom-up market sizing
 * Aggregate segments with penetration rates
 */
export function calculateBottomUp(params: {
  segments: MarketSegment[]
  marketParams: MarketCalculationParams
  competitorCount: number
  marketShareTarget: number
}): MarketSizes {
  const { segments, marketParams, competitorCount, marketShareTarget } = params

  if (segments.length === 0) {
    throw new Error("At least one market segment is required")
  }

  // Calculate TAM from all segments
  const tam = segments.reduce((total, segment) => {
    const segmentValue = segment.users * segment.avgPrice
    const growthAdjusted = segmentValue * (1 + segment.growthRate / 100)
    return total + growthAdjusted
  }, 0)

  // Calculate SAM based on addressable segments
  const sam = segments.reduce((total, segment) => {
    const segmentValue = segment.users * segment.avgPrice
    const addressable = segmentValue * (segment.penetrationRate / 100)
    return total + addressable
  }, 0)

  // Calculate SOM based on realistic market share
  const competitiveAdjustment = 1 / (competitorCount + 1) // Simple competitive factor
  const som = sam * (marketShareTarget / 100) * competitiveAdjustment

  // Apply market maturity adjustments
  const maturityMultiplier = getMaturityMultiplier(marketParams.marketMaturity)

  const adjustedSizes = {
    tam: tam * maturityMultiplier,
    sam: sam * maturityMultiplier,
    som: som * maturityMultiplier,
  }

  // Adjust for time period
  const periodAdjustedSizes = adjustForTimePeriod(adjustedSizes, marketParams.timePeriod)

  return {
    ...periodAdjustedSizes,
    method: "bottomUp",
    segments,
    assumptions: [
      `${segments.length} market segments analyzed`,
      `Average penetration rate: ${calculateAvgPenetration(segments).toFixed(1)}%`,
      `${competitorCount} major competitors considered`,
      `Target market share: ${marketShareTarget}%`,
      `Market maturity factor: ${maturityMultiplier}x`,
    ],
    confidence: calculateConfidence(marketParams, segments),
  }
}

/**
 * Get market maturity multiplier
 */
function getMaturityMultiplier(maturity: string): number {
  const multipliers = {
    emerging: 1.3, // High growth potential
    growing: 1.1, // Moderate growth
    mature: 1.0, // Stable
    declining: 0.9, // Contracting market
  }
  return multipliers[maturity as keyof typeof multipliers] || 1.0
}

/**
 * Adjust market sizes for time period
 */
function adjustForTimePeriod(
  sizes: { tam: number; sam: number; som: number },
  period: string
): { tam: number; sam: number; som: number } {
  const dividers = {
    monthly: 12,
    quarterly: 4,
    annual: 1,
  }
  const divider = dividers[period as keyof typeof dividers] || 1

  return {
    tam: sizes.tam / divider,
    sam: sizes.sam / divider,
    som: sizes.som / divider,
  }
}

/**
 * Calculate average penetration rate
 */
function calculateAvgPenetration(segments: MarketSegment[]): number {
  if (segments.length === 0) return 0
  const total = segments.reduce((sum, segment) => sum + segment.penetrationRate, 0)
  return total / segments.length
}

/**
 * Calculate confidence score based on parameters
 */
function calculateConfidence(params: MarketCalculationParams, segments?: MarketSegment[]): number {
  let confidence = 70 // Base confidence

  // Geographic scope adjustment
  if (params.geographicScope === "country") confidence += 10
  else if (params.geographicScope === "regional") confidence += 5

  // Market maturity adjustment
  if (params.marketMaturity === "mature") confidence += 10
  else if (params.marketMaturity === "growing") confidence += 5
  else if (params.marketMaturity === "declining") confidence -= 10

  // Segment detail adjustment (for bottom-up)
  if (segments && segments.length > 3) confidence += 10
  if (segments && segments.length > 5) confidence += 5

  return Math.min(100, Math.max(0, confidence))
}

/**
 * Format currency with proper symbol and abbreviation
 */
export function formatCurrency(
  value: number,
  currency: Currency = "USD",
  abbreviated = true
): string {
  const symbols = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
    INR: "₹",
  }

  const symbol = symbols[currency] || "$"

  if (abbreviated && value >= 1000) {
    if (value >= 1e12) return `${symbol}${(value / 1e12).toFixed(1)}T`
    if (value >= 1e9) return `${symbol}${(value / 1e9).toFixed(1)}B`
    if (value >= 1e6) return `${symbol}${(value / 1e6).toFixed(1)}M`
    if (value >= 1e3) return `${symbol}${(value / 1e3).toFixed(1)}K`
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * Parse currency input string to number
 */
export function parseCurrencyInput(input: string): number {
  // Remove currency symbols and whitespace
  const cleaned = input.replace(/[$€£¥₹,\s]/g, "")

  // Handle abbreviated values
  const multipliers: Record<string, number> = {
    k: 1e3,
    K: 1e3,
    m: 1e6,
    M: 1e6,
    b: 1e9,
    B: 1e9,
    t: 1e12,
    T: 1e12,
  }

  const match = cleaned.match(/^([\d.]+)([kmbtKMBT]?)$/i)
  if (match) {
    const value = parseFloat(match[1])
    const suffix = match[2]
    const multiplier = suffix ? multipliers[suffix] || 1 : 1
    return value * multiplier
  }

  return parseFloat(cleaned) || 0
}

/**
 * Validate market sizes for logical consistency
 */
export function validateMarketSizes(sizes: MarketSizes): string[] {
  const errors: string[] = []

  if (sizes.tam <= 0) errors.push("TAM must be greater than 0")
  if (sizes.sam > sizes.tam) errors.push("SAM cannot exceed TAM")
  if (sizes.som > sizes.sam) errors.push("SOM cannot exceed SAM")
  if (sizes.som < 0) errors.push("SOM cannot be negative")

  return errors
}

/**
 * Calculate market efficiency metric
 */
export function calculateMarketEfficiency(tam: number, _sam: number, som: number): string {
  const efficiency = (som / tam) * 100
  if (efficiency > 10) return "High"
  if (efficiency > 5) return "Medium"
  return "Low"
}

/**
 * Calculate CAGR (Compound Annual Growth Rate)
 */
export function calculateCAGR(beginValue: number, endValue: number, years: number): number {
  if (beginValue <= 0 || years <= 0) return 0
  return ((endValue / beginValue) ** (1 / years) - 1) * 100
}

/**
 * Get market size category
 */
export function getMarketSizeCategory(tam: number): {
  label: string
  color: string
} {
  if (tam >= 100e9) return { label: "Mega Market", color: "purple" }
  if (tam >= 10e9) return { label: "Large Market", color: "blue" }
  if (tam >= 1e9) return { label: "Medium Market", color: "green" }
  if (tam >= 100e6) return { label: "Small Market", color: "yellow" }
  return { label: "Niche Market", color: "orange" }
}
