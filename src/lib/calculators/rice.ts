import type { RiceScore } from "~/types"

/**
 * Calculate RICE score from input parameters
 * Formula: (Reach × Impact × Confidence) / Effort
 */
export function calculateRiceScore(params: {
  reach: number
  impact: number
  confidence: number // As percentage (0-100)
  effort: number
}): number {
  const { reach, impact, confidence, effort } = params

  // Validate inputs
  if (reach < 0 || impact < 0 || confidence < 0 || effort <= 0) {
    throw new Error(
      "Invalid input values: All values must be positive, effort must be greater than 0"
    )
  }

  if (confidence > 100) {
    throw new Error("Confidence cannot exceed 100%")
  }

  // Convert confidence from percentage to decimal
  const confidenceDecimal = confidence / 100

  // Calculate RICE score
  const score = (reach * impact * confidenceDecimal) / effort

  // Round to 1 decimal place
  return Math.round(score * 10) / 10
}

/**
 * Get RICE score category based on score value
 */
export function getRiceScoreCategory(score: number): {
  label: string
  color: string
  priority: number
  description: string
} {
  if (score >= 100) {
    return {
      label: "Must Do",
      color: "green",
      priority: 1,
      description: "Critical priority - implement immediately",
    }
  }

  if (score >= 50) {
    return {
      label: "Should Do",
      color: "yellow",
      priority: 2,
      description: "High priority - implement soon",
    }
  }

  if (score >= 20) {
    return {
      label: "Could Do",
      color: "orange",
      priority: 3,
      description: "Medium priority - consider for roadmap",
    }
  }

  return {
    label: "Won't Do",
    color: "red",
    priority: 4,
    description: "Low priority - defer or decline",
  }
}

/**
 * Format RICE score for display
 */
export function formatRiceScore(score: number): string {
  return score.toFixed(1)
}

/**
 * Calculate the percentage contribution of each component to the final score
 */
export function calculateComponentContributions(params: {
  reach: number
  impact: number
  confidence: number
  effort: number
}): {
  reach: number
  impact: number
  confidence: number
  effort: number
} {
  const { reach, impact, confidence, effort } = params

  // Calculate raw contributions (without effort division)
  const totalProduct = reach * impact * (confidence / 100)

  if (totalProduct === 0) {
    return { reach: 0, impact: 0, confidence: 0, effort: 0 }
  }

  // Calculate percentage contributions
  const reachContribution = (reach / totalProduct) * 100
  const impactContribution = (impact / totalProduct) * 100
  const confidenceContribution = (confidence / 100 / totalProduct) * 100

  // Effort reduces the score, so we show it as a negative contribution
  const effortContribution = effort > 1 ? -((effort - 1) / effort) * 100 : 0

  return {
    reach: Math.round(reachContribution),
    impact: Math.round(impactContribution),
    confidence: Math.round(confidenceContribution),
    effort: Math.round(effortContribution),
  }
}

/**
 * Generate insights based on RICE score components
 */
export function generateRiceInsights(params: {
  reach: number
  impact: number
  confidence: number
  effort: number
  score: number
}): string[] {
  const insights: string[] = []
  const { reach, impact, confidence, effort, score } = params
  const category = getRiceScoreCategory(score)

  // Score-based insight
  insights.push(`This feature is a "${category.label}" priority with a score of ${score}`)

  // Reach insights
  if (reach < 100) {
    insights.push("Consider ways to increase reach to impact more users")
  } else if (reach > 10000) {
    insights.push("Excellent reach! This will impact a large user base")
  }

  // Impact insights
  if (impact < 1) {
    insights.push("Low impact score - ensure this aligns with strategic goals")
  } else if (impact >= 2) {
    insights.push("High impact feature that will significantly improve user experience")
  }

  // Confidence insights
  if (confidence < 50) {
    insights.push("Low confidence - consider more research or prototyping")
  } else if (confidence >= 80) {
    insights.push("High confidence level indicates good validation")
  }

  // Effort insights
  if (effort > 6) {
    insights.push("High effort requirement - consider breaking into smaller features")
  } else if (effort <= 1) {
    insights.push("Low effort - great candidate for quick wins")
  }

  // Score optimization insights
  if (score < 20 && effort > 3) {
    insights.push("High effort for low score - reconsider scope or deprioritize")
  }

  if (score > 50 && effort <= 2) {
    insights.push("Excellent ROI - low effort with high impact")
  }

  return insights
}

/**
 * Compare two RICE scores and provide recommendation
 */
export function compareRiceScores(
  scoreA: RiceScore,
  scoreB: RiceScore
): {
  winner: RiceScore
  difference: number
  recommendation: string
} {
  const difference = Math.abs(scoreA.score - scoreB.score)
  const winner = scoreA.score >= scoreB.score ? scoreA : scoreB
  const loser = scoreA.score < scoreB.score ? scoreA : scoreB

  let recommendation = ""

  if (difference < 5) {
    recommendation = "Scores are very close - consider other factors like strategic alignment"
  } else if (difference < 20) {
    recommendation = `${winner.name} is moderately better than ${loser.name}`
  } else {
    recommendation = `${winner.name} is significantly better than ${loser.name}`
  }

  // Add context based on categories
  const winnerCategory = getRiceScoreCategory(winner.score)
  const loserCategory = getRiceScoreCategory(loser.score)

  if (winnerCategory.priority !== loserCategory.priority) {
    recommendation += `. ${winner.name} is a "${winnerCategory.label}" while ${loser.name} is a "${loserCategory.label}"`
  }

  return { winner, difference, recommendation }
}

/**
 * Calculate average RICE score from a list of calculations
 */
export function calculateAverageScore(calculations: RiceScore[]): number {
  if (calculations.length === 0) return 0

  const sum = calculations.reduce((acc, calc) => acc + calc.score, 0)
  return Math.round((sum / calculations.length) * 10) / 10
}

/**
 * Get score distribution for a list of calculations
 */
export function getScoreDistribution(calculations: RiceScore[]): {
  mustDo: number
  shouldDo: number
  couldDo: number
  wontDo: number
} {
  const distribution = {
    mustDo: 0,
    shouldDo: 0,
    couldDo: 0,
    wontDo: 0,
  }

  calculations.forEach((calc) => {
    const category = getRiceScoreCategory(calc.score)
    switch (category.label) {
      case "Must Do":
        distribution.mustDo++
        break
      case "Should Do":
        distribution.shouldDo++
        break
      case "Could Do":
        distribution.couldDo++
        break
      case "Won't Do":
        distribution.wontDo++
        break
    }
  })

  return distribution
}
