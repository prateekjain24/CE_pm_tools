import type {
  MonteCarloResults,
  MonthlyProjection,
  RiskFactor,
  RoiCalculation,
  RoiMetrics,
} from "~/types"

/**
 * Calculate all ROI metrics for a given calculation
 */
export function calculateRoiMetrics(calculation: RoiCalculation): RoiMetrics {
  const projections = calculateMonthlyProjections(calculation)
  const totalCosts = calculateTotalCosts(calculation)
  const totalBenefits = calculateTotalBenefits(calculation)

  // Simple ROI
  const simpleRoi = totalCosts > 0 ? ((totalBenefits - totalCosts) / totalCosts) * 100 : 0

  // NPV (Net Present Value)
  const npv = calculateNPV(projections, calculation.discountRate)

  // IRR (Internal Rate of Return)
  const irr = calculateIRR(projections)

  // MIRR (Modified IRR) - optional
  const mirr = calculation.discountRate
    ? calculateMIRR(projections, calculation.discountRate)
    : undefined

  // Payback Period
  const paybackPeriod = calculatePaybackPeriod(projections)
  const discountedPaybackPeriod = calculateDiscountedPaybackPeriod(
    projections,
    calculation.discountRate
  )

  // Break-even month
  const breakEvenMonth = findBreakEvenMonth(projections)

  // Profitability Index (PI)
  const pi =
    calculation.initialCost > 0 ? (npv + calculation.initialCost) / calculation.initialCost : 0

  // Economic Value Added (EVA) - simplified
  const eva = npv - calculation.initialCost * (calculation.discountRate / 100)

  return {
    simpleRoi,
    npv,
    irr: irr * 100, // Convert to percentage
    mirr: mirr ? mirr * 100 : undefined,
    paybackPeriod,
    discountedPaybackPeriod,
    breakEvenMonth,
    pi,
    eva,
  }
}

/**
 * Calculate monthly cash flow projections
 */
export function calculateMonthlyProjections(calculation: RoiCalculation): MonthlyProjection[] {
  const projections: MonthlyProjection[] = []
  let cumulativeCashFlow = -calculation.initialCost
  let discountedCumulative = -calculation.initialCost

  const monthlyDiscountRate = calculation.discountRate / 100 / 12

  for (let month = 1; month <= calculation.timeHorizon; month++) {
    // Calculate costs for this month
    const costs = calculateMonthCosts(calculation, month)

    // Calculate benefits for this month
    const benefits = calculateMonthBenefits(calculation, month)

    // Net cash flow
    const netCashFlow = benefits - costs

    // Update cumulative
    cumulativeCashFlow += netCashFlow

    // Discounted cash flow
    const discountFactor = (1 + monthlyDiscountRate) ** month
    const discountedCashFlow = netCashFlow / discountFactor
    discountedCumulative += discountedCashFlow

    projections.push({
      month,
      costs,
      benefits,
      netCashFlow,
      cumulativeCashFlow,
      discountedCashFlow,
      discountedCumulative,
    })
  }

  return projections
}

/**
 * Calculate costs for a specific month
 */
function calculateMonthCosts(calculation: RoiCalculation, month: number): number {
  let totalCosts = month === 1 ? calculation.initialCost : 0

  for (const cost of calculation.recurringCosts) {
    if (month >= cost.startMonth && month < cost.startMonth + cost.months) {
      const amount = cost.isRecurring ? cost.amount : cost.amount / cost.months
      totalCosts += amount
    }
  }

  return totalCosts
}

/**
 * Calculate benefits for a specific month
 */
function calculateMonthBenefits(calculation: RoiCalculation, month: number): number {
  let totalBenefits = 0

  for (const benefit of calculation.benefits) {
    if (month >= benefit.startMonth && month < benefit.startMonth + benefit.months) {
      const amount = benefit.isRecurring ? benefit.amount : benefit.amount / benefit.months
      const probability = (benefit.probability ?? 100) / 100
      totalBenefits += amount * probability
    }
  }

  return totalBenefits
}

/**
 * Calculate total costs over the time horizon
 */
function calculateTotalCosts(calculation: RoiCalculation): number {
  let total = calculation.initialCost

  for (const cost of calculation.recurringCosts) {
    if (cost.isRecurring) {
      total += cost.amount * cost.months
    } else {
      total += cost.amount
    }
  }

  return total
}

/**
 * Calculate total benefits over the time horizon
 */
function calculateTotalBenefits(calculation: RoiCalculation): number {
  let total = 0

  for (const benefit of calculation.benefits) {
    const probability = (benefit.probability ?? 100) / 100
    if (benefit.isRecurring) {
      total += benefit.amount * benefit.months * probability
    } else {
      total += benefit.amount * probability
    }
  }

  return total
}

/**
 * Calculate Net Present Value (NPV)
 */
function calculateNPV(projections: MonthlyProjection[], annualDiscountRate: number): number {
  const monthlyRate = annualDiscountRate / 100 / 12
  let npv = projections[0]?.netCashFlow || 0 // Initial investment

  for (let i = 1; i < projections.length; i++) {
    const discountFactor = (1 + monthlyRate) ** i
    npv += projections[i].netCashFlow / discountFactor
  }

  return npv
}

/**
 * Calculate Internal Rate of Return (IRR) using Newton-Raphson method
 */
function calculateIRR(projections: MonthlyProjection[], maxIterations = 100): number {
  const cashFlows = projections.map((p) => p.netCashFlow)

  // Initial guess (10% annually, converted to monthly)
  let rate = 0.1 / 12
  const tolerance = 0.00001

  for (let i = 0; i < maxIterations; i++) {
    const { npv, derivative } = getNPVAndDerivative(cashFlows, rate)

    if (Math.abs(npv) < tolerance) {
      return rate * 12 // Convert back to annual rate
    }

    // Newton-Raphson update
    const newRate = rate - npv / derivative

    // Bounds checking to prevent divergence
    if (newRate < -0.99) {
      rate = -0.99
    } else if (newRate > 10) {
      rate = 10
    } else {
      rate = newRate
    }
  }

  return rate * 12 // Return annual rate even if not converged
}

/**
 * Helper function for IRR calculation
 */
function getNPVAndDerivative(
  cashFlows: number[],
  rate: number
): { npv: number; derivative: number } {
  let npv = 0
  let derivative = 0

  for (let t = 0; t < cashFlows.length; t++) {
    const discountFactor = (1 + rate) ** t
    npv += cashFlows[t] / discountFactor

    if (t > 0) {
      derivative -= (t * cashFlows[t]) / (1 + rate) ** (t + 1)
    }
  }

  return { npv, derivative }
}

/**
 * Calculate Modified Internal Rate of Return (MIRR)
 */
function calculateMIRR(projections: MonthlyProjection[], annualDiscountRate: number): number {
  const monthlyRate = annualDiscountRate / 100 / 12
  const reinvestmentRate = monthlyRate // Assume reinvestment at discount rate

  let pvNegativeCashFlows = 0
  let fvPositiveCashFlows = 0
  const n = projections.length

  for (let t = 0; t < n; t++) {
    const cashFlow = projections[t].netCashFlow

    if (cashFlow < 0) {
      // Discount negative cash flows to present
      pvNegativeCashFlows += cashFlow / (1 + monthlyRate) ** t
    } else {
      // Compound positive cash flows to future
      fvPositiveCashFlows += cashFlow * (1 + reinvestmentRate) ** (n - t - 1)
    }
  }

  if (pvNegativeCashFlows === 0) return 0

  // MIRR formula
  const mirr = (fvPositiveCashFlows / Math.abs(pvNegativeCashFlows)) ** (1 / n) - 1
  return mirr * 12 // Convert to annual rate
}

/**
 * Calculate payback period (months to recover initial investment)
 */
function calculatePaybackPeriod(projections: MonthlyProjection[]): number {
  for (let i = 0; i < projections.length; i++) {
    if (projections[i].cumulativeCashFlow >= 0) {
      // Linear interpolation for partial months
      if (i > 0) {
        const prevCumulative = projections[i - 1].cumulativeCashFlow
        const currentCumulative = projections[i].cumulativeCashFlow
        const monthlyFlow = currentCumulative - prevCumulative

        if (monthlyFlow !== 0) {
          const fractionOfMonth = Math.abs(prevCumulative) / monthlyFlow
          return i + fractionOfMonth
        }
      }
      return i + 1
    }
  }

  return projections.length // Not paid back within time horizon
}

/**
 * Calculate discounted payback period
 */
function calculateDiscountedPaybackPeriod(
  projections: MonthlyProjection[],
  annualDiscountRate: number
): number {
  const monthlyRate = annualDiscountRate / 100 / 12
  let discountedCumulative = projections[0]?.netCashFlow || 0

  for (let i = 1; i < projections.length; i++) {
    const discountFactor = (1 + monthlyRate) ** i
    discountedCumulative += projections[i].netCashFlow / discountFactor

    if (discountedCumulative >= 0) {
      // Linear interpolation for partial months
      if (i > 0) {
        const _prevDiscountedFlow = projections[i - 1].netCashFlow / (1 + monthlyRate) ** (i - 1)
        const currentDiscountedFlow = projections[i].netCashFlow / discountFactor
        const prevCumulative = discountedCumulative - currentDiscountedFlow

        if (currentDiscountedFlow !== 0) {
          const fractionOfMonth = Math.abs(prevCumulative) / currentDiscountedFlow
          return i + fractionOfMonth
        }
      }
      return i + 1
    }
  }

  return projections.length // Not paid back within time horizon
}

/**
 * Find the month when break-even occurs
 */
function findBreakEvenMonth(projections: MonthlyProjection[]): number {
  for (let i = 0; i < projections.length; i++) {
    if (projections[i].cumulativeCashFlow >= 0) {
      return i + 1
    }
  }
  return -1 // Never breaks even
}

/**
 * Apply risk factors to a calculation
 */
export function applyRiskFactors(
  calculation: RoiCalculation,
  riskFactors: RiskFactor[]
): RoiCalculation {
  const adjustedCalc = { ...calculation }

  // Apply risk impacts to affected line items
  for (const risk of riskFactors) {
    const riskProbability = risk.probability
    const impact = risk.impact

    // Apply mitigation if present
    const mitigationEffect = risk.mitigation ? risk.mitigation.effectiveness : 0
    const effectiveImpact = impact * (1 - mitigationEffect)

    // Adjust affected items
    for (const itemId of risk.affectedItems) {
      // Check in costs
      adjustedCalc.recurringCosts = adjustedCalc.recurringCosts.map((cost) => {
        if (cost.id === itemId) {
          return {
            ...cost,
            amount: cost.amount * (1 + (effectiveImpact - 1) * riskProbability),
          }
        }
        return cost
      })

      // Check in benefits
      adjustedCalc.benefits = adjustedCalc.benefits.map((benefit) => {
        if (benefit.id === itemId) {
          return {
            ...benefit,
            amount: benefit.amount * (1 - (1 - effectiveImpact) * riskProbability),
          }
        }
        return benefit
      })
    }
  }

  return adjustedCalc
}

/**
 * Run Monte Carlo simulation for uncertainty analysis
 */
export function runMonteCarloSimulation(
  calculation: RoiCalculation,
  iterations = 1000,
  uncertaintyRange = 0.2 // ±20% variation
): MonteCarloResults {
  const results: { roi: number[]; npv: number[]; payback: number[] } = {
    roi: [],
    npv: [],
    payback: [],
  }

  for (let i = 0; i < iterations; i++) {
    // Create randomized version of calculation
    const randomizedCalc = randomizeCalculation(calculation, uncertaintyRange)

    // Calculate metrics
    const metrics = calculateRoiMetrics(randomizedCalc)

    results.roi.push(metrics.simpleRoi)
    results.npv.push(metrics.npv)
    results.payback.push(metrics.paybackPeriod)
  }

  // Calculate statistics
  const roiStats = calculateStatistics(results.roi)
  const npvStats = calculateStatistics(results.npv)
  const paybackStats = calculateStatistics(results.payback)

  // Success probability (positive NPV)
  const successProbability = results.npv.filter((npv) => npv > 0).length / iterations

  return {
    iterations,
    metrics: {
      roi: roiStats,
      npv: npvStats,
      payback: paybackStats,
    },
    successProbability,
    distributions: results,
  }
}

/**
 * Randomize calculation inputs for Monte Carlo
 */
function randomizeCalculation(calculation: RoiCalculation, range: number): RoiCalculation {
  const randomized = { ...calculation }

  // Randomize initial cost
  randomized.initialCost = calculation.initialCost * (1 + (Math.random() - 0.5) * 2 * range)

  // Randomize recurring costs
  randomized.recurringCosts = calculation.recurringCosts.map((cost) => ({
    ...cost,
    amount: cost.amount * (1 + (Math.random() - 0.5) * 2 * range),
  }))

  // Randomize benefits
  randomized.benefits = calculation.benefits.map((benefit) => ({
    ...benefit,
    amount: benefit.amount * (1 + (Math.random() - 0.5) * 2 * range),
  }))

  return randomized
}

/**
 * Calculate statistics for an array of numbers
 */
function calculateStatistics(values: number[]): {
  p10: number
  p50: number
  p90: number
  mean: number
  stdDev: number
} {
  const sorted = [...values].sort((a, b) => a - b)
  const n = sorted.length

  const mean = values.reduce((sum, val) => sum + val, 0) / n
  const variance = values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / n
  const stdDev = Math.sqrt(variance)

  return {
    p10: sorted[Math.floor(n * 0.1)],
    p50: sorted[Math.floor(n * 0.5)],
    p90: sorted[Math.floor(n * 0.9)],
    mean,
    stdDev,
  }
}

/**
 * Format currency value
 */
export function formatCurrency(value: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * Get ROI category based on value
 */
export function getRoiCategory(roi: number): {
  label: string
  color: string
  description: string
} {
  if (roi >= 200) {
    return {
      label: "Excellent",
      color: "green",
      description: "Exceptional return on investment",
    }
  } else if (roi >= 100) {
    return {
      label: "Good",
      color: "blue",
      description: "Strong return on investment",
    }
  } else if (roi >= 50) {
    return {
      label: "Moderate",
      color: "yellow",
      description: "Acceptable return on investment",
    }
  } else if (roi >= 0) {
    return {
      label: "Low",
      color: "orange",
      description: "Minimal return on investment",
    }
  } else {
    return {
      label: "Negative",
      color: "red",
      description: "Loss on investment",
    }
  }
}
