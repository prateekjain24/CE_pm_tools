/**
 * A/B Test Statistical Calculations
 * Comprehensive library for statistical testing including frequentist, Bayesian, sequential, and MAB methods
 */

import type {
  CorrectionMethod,
  SampleSizeInputs,
  SampleSizeResult,
  TestConfig,
  TestResult,
  Variation,
} from "~/types"

// Constants for statistical calculations
const Z_SCORES = {
  90: 1.645, // 90% confidence (one-tailed)
  95: 1.96, // 95% confidence (one-tailed)
  99: 2.576, // 99% confidence (one-tailed)
}

const _T_DISTRIBUTION_INFINITY = 10000 // Use z-score for large samples

/**
 * Calculate z-score for given confidence level and test type
 */
function getZScore(confidenceLevel: number, testDirection: "one-tailed" | "two-tailed"): number {
  const zScore = Z_SCORES[confidenceLevel as keyof typeof Z_SCORES] || 1.96
  return testDirection === "two-tailed" ? zScore : qnorm((confidenceLevel + 100) / 200)
}

/**
 * Normal distribution CDF approximation (Abramowitz and Stegun)
 */
function pnorm(z: number): number {
  const sign = z < 0 ? -1 : 1
  const absZ = Math.abs(z)
  const a1 = 0.254829592
  const a2 = -0.284496736
  const a3 = 1.421413741
  const a4 = -1.453152027
  const a5 = 1.061405429
  const p = 0.3275911
  const t = 1.0 / (1.0 + p * absZ)
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp((-absZ * absZ) / 2)
  return 0.5 * (1.0 + sign * y)
}

/**
 * Inverse normal CDF approximation
 */
function qnorm(p: number): number {
  if (p <= 0 || p >= 1) {
    throw new Error("Probability must be between 0 and 1")
  }

  // Coefficients for rational approximation
  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2,
    -3.066479806614716e1, 2.506628277459239,
  ]

  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1,
    -1.328068155288572e1,
  ]

  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734,
    4.374664141464968, 2.938163982698783,
  ]

  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416]

  const pLow = 0.02425
  const pHigh = 1 - pLow

  let q: number, r: number

  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p))
    return (
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    )
  } else if (p <= pHigh) {
    q = p - 0.5
    r = q * q
    return (
      ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
    )
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p))
    return (
      -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    )
  }
}

/**
 * Calculate pooled standard error for two proportions
 */
function getPooledStandardError(p1: number, n1: number, p2: number, n2: number): number {
  const pooledP = (p1 * n1 + p2 * n2) / (n1 + n2)
  return Math.sqrt(pooledP * (1 - pooledP) * (1 / n1 + 1 / n2))
}

/**
 * Calculate standard error for difference of two proportions
 */
function getStandardError(p1: number, n1: number, p2: number, n2: number): number {
  return Math.sqrt((p1 * (1 - p1)) / n1 + (p2 * (1 - p2)) / n2)
}

/**
 * Main frequentist analysis function
 */
export function calculateFrequentist(variations: Variation[], config: TestConfig): TestResult[] {
  if (variations.length < 2) {
    throw new Error("At least 2 variations required for A/B test")
  }

  const control = variations[0]
  const results: TestResult[] = []

  // Calculate control conversion rate
  const controlRate = control.conversions / control.visitors

  // Compare each variant against control
  for (let i = 1; i < variations.length; i++) {
    const variant = variations[i]
    const variantRate = variant.conversions / variant.visitors

    // Calculate test statistic (z-score)
    const pooledSE = getPooledStandardError(
      controlRate,
      control.visitors,
      variantRate,
      variant.visitors
    )

    const zScore = pooledSE > 0 ? (variantRate - controlRate) / pooledSE : 0

    // Calculate p-value
    let pValue: number
    if (config.testDirection === "two-tailed") {
      pValue = 2 * (1 - pnorm(Math.abs(zScore)))
    } else {
      pValue = 1 - pnorm(zScore)
    }

    // Apply multiple testing correction if needed
    if (variations.length > 2 && config.correctionMethod && config.correctionMethod !== "none") {
      pValue = adjustPValue(pValue, variations.length - 1, config.correctionMethod)
    }

    // Calculate confidence interval
    const se = getStandardError(controlRate, control.visitors, variantRate, variant.visitors)
    const criticalValue = getZScore(config.confidenceLevel, config.testDirection)
    const marginOfError = criticalValue * se
    const uplift = variantRate - controlRate
    const confidenceInterval: [number, number] = [uplift - marginOfError, uplift + marginOfError]

    // Calculate relative uplift
    const relativeUplift = controlRate > 0 ? ((variantRate - controlRate) / controlRate) * 100 : 0

    // Calculate statistical power
    const power = calculatePower(
      control.visitors,
      variant.visitors,
      controlRate,
      variantRate,
      config.confidenceLevel / 100,
      config.testDirection
    )

    // Calculate effect size (Cohen's h for proportions)
    const effectSize = calculateCohenH(controlRate, variantRate)

    // Determine significance
    const alpha = 1 - config.confidenceLevel / 100
    const isSignificant = pValue < alpha

    results.push({
      method: "frequentist",
      pValue,
      isSignificant,
      confidenceInterval,
      uplift: relativeUplift,
      absoluteUplift: uplift,
      effectSize,
      power,
      multipleTestingAdjusted: variations.length > 2 && config.correctionMethod !== "none",
      winner: isSignificant && uplift > 0 ? variant.id : undefined,
    })
  }

  return results
}

/**
 * Calculate Cohen's h effect size for proportions
 */
function calculateCohenH(p1: number, p2: number): number {
  // Use arcsin transformation
  const phi1 = 2 * Math.asin(Math.sqrt(p1))
  const phi2 = 2 * Math.asin(Math.sqrt(p2))
  return phi2 - phi1
}

/**
 * Calculate statistical power
 */
function calculatePower(
  n1: number,
  n2: number,
  p1: number,
  p2: number,
  alpha: number,
  testDirection: "one-tailed" | "two-tailed"
): number {
  const delta = Math.abs(p2 - p1)
  const pooledP = (p1 * n1 + p2 * n2) / (n1 + n2)
  const se0 = Math.sqrt(pooledP * (1 - pooledP) * (1 / n1 + 1 / n2))
  const se1 = Math.sqrt((p1 * (1 - p1)) / n1 + (p2 * (1 - p2)) / n2)

  const criticalZ = testDirection === "two-tailed" ? qnorm(1 - alpha / 2) : qnorm(1 - alpha)

  const z = (delta - criticalZ * se0) / se1
  return pnorm(z)
}

/**
 * Multiple testing correction
 */
export function adjustPValue(pValue: number, numTests: number, method: CorrectionMethod): number {
  switch (method) {
    case "bonferroni":
      return Math.min(pValue * numTests, 1)

    case "holm":
      // Simplified Holm method (requires all p-values for full implementation)
      return Math.min(pValue * numTests, 1)

    case "fdr":
      // Simplified FDR (Benjamini-Hochberg requires all p-values)
      return Math.min((pValue * numTests) / 2, 1)

    default:
      return pValue
  }
}

/**
 * Sample size calculation for frequentist test
 */
export function calculateFrequentistSampleSize(inputs: SampleSizeInputs): SampleSizeResult {
  const { metric, effect, statisticalParams, traffic } = inputs

  if (metric.type !== "binary") {
    throw new Error("Only binary metrics supported in this implementation")
  }

  const p1 = metric.baseline / 100
  const delta = effect.type === "relative" ? (effect.value / 100) * p1 : effect.value / 100
  const p2 = p1 + delta

  const alpha = 1 - statisticalParams.confidenceLevel / 100
  const beta = 1 - statisticalParams.power / 100

  // Get critical values
  const zAlpha =
    statisticalParams.testDirection === "two-tailed" ? qnorm(1 - alpha / 2) : qnorm(1 - alpha)
  const zBeta = qnorm(1 - beta)

  // Calculate sample size per variation
  const pooledP = (p1 + p2) / 2
  const n = Math.ceil((2 * (zAlpha + zBeta) ** 2 * pooledP * (1 - pooledP)) / (p2 - p1) ** 2)

  // Adjust for multiple comparisons
  let adjustedN = n
  if (statisticalParams.multipleComparisons && statisticalParams.multipleComparisons > 1) {
    // Approximate adjustment for multiple comparisons
    const adjustedAlpha = alpha / statisticalParams.multipleComparisons
    const adjustedZAlpha =
      statisticalParams.testDirection === "two-tailed"
        ? qnorm(1 - adjustedAlpha / 2)
        : qnorm(1 - adjustedAlpha)

    adjustedN = Math.ceil(
      (2 * (adjustedZAlpha + zBeta) ** 2 * pooledP * (1 - pooledP)) / (p2 - p1) ** 2
    )
  }

  // Calculate duration
  const totalSample = adjustedN * Object.keys(traffic.allocation).length
  const effectiveDaily = calculateEffectiveDailyTraffic(traffic.daily, traffic.seasonality)
  const durationDays = Math.ceil(totalSample / effectiveDaily)

  // Calculate cost if provided
  let cost: { total: number; perVariation: Record<string, number> } | undefined
  if (traffic.constraints?.costPerSample) {
    cost = {
      total: totalSample * traffic.constraints.costPerSample,
      perVariation: {
        control: adjustedN * traffic.constraints.costPerSample,
        variant: adjustedN * traffic.constraints.costPerSample,
      },
    }
  }

  return {
    perVariation: {
      control: adjustedN,
      variant: adjustedN,
    },
    total: totalSample,
    powerAchieved: statisticalParams.power,
    duration: {
      days: durationDays,
      weeks: Math.ceil(durationDays / 7),
      confidenceInterval: [Math.floor(durationDays * 0.8), Math.ceil(durationDays * 1.2)],
    },
    cost,
    notes: [
      statisticalParams.multipleComparisons && statisticalParams.multipleComparisons > 1
        ? `Sample size adjusted for ${statisticalParams.multipleComparisons} comparisons`
        : null,
      traffic.seasonality ? "Duration estimate accounts for seasonality" : null,
      effect.practicalSignificance
        ? `Practical significance threshold: ${effect.practicalSignificance}%`
        : null,
    ].filter(Boolean) as string[],
  }
}

/**
 * Calculate effective daily traffic accounting for seasonality
 */
function calculateEffectiveDailyTraffic(
  baseDaily: number,
  seasonality?: SampleSizeInputs["traffic"]["seasonality"]
): number {
  if (!seasonality) return baseDaily

  // Calculate average multiplier from day of week pattern
  const avgDayOfWeek = seasonality.dayOfWeek.reduce((sum, mult) => sum + mult, 0) / 7

  // For simplicity, we'll use the day of week average
  // In a real implementation, you'd also factor in monthly and holiday effects
  return baseDaily * avgDayOfWeek
}

/**
 * Calculate minimum detectable effect (MDE)
 */
export function calculateMDE(
  sampleSize: number,
  baselineRate: number,
  alpha: number = 0.05,
  power: number = 0.8,
  testDirection: "one-tailed" | "two-tailed" = "two-tailed"
): number {
  const zAlpha = testDirection === "two-tailed" ? qnorm(1 - alpha / 2) : qnorm(1 - alpha)
  const zBeta = qnorm(power)

  const p = baselineRate
  const mde = Math.sqrt((2 * p * (1 - p) * (zAlpha + zBeta) ** 2) / sampleSize)

  return mde
}

/**
 * Confidence interval for conversion rate difference
 */
export function getConfidenceInterval(
  p1: number,
  n1: number,
  p2: number,
  n2: number,
  confidence: number = 0.95,
  testDirection: "one-tailed" | "two-tailed" = "two-tailed"
): [number, number] {
  const diff = p2 - p1
  const se = getStandardError(p1, n1, p2, n2)
  const z = testDirection === "two-tailed" ? qnorm((1 + confidence) / 2) : qnorm(confidence)

  const margin = z * se
  return [diff - margin, diff + margin]
}

/**
 * Check if sample size is sufficient for desired power
 */
export function isSampleSizeSufficient(
  n: number,
  baselineRate: number,
  mde: number,
  alpha: number = 0.05,
  desiredPower: number = 0.8,
  testDirection: "one-tailed" | "two-tailed" = "two-tailed"
): boolean {
  const actualPower = calculatePower(n, n, baselineRate, baselineRate + mde, alpha, testDirection)

  return actualPower >= desiredPower
}
