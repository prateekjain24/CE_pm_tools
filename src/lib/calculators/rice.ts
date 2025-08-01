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
 * With 1-10 scales, max theoretical score is 100, typical range is 0-50
 */
export function getRiceScoreCategory(score: number): {
  label: string
  color: string
  priority: number
  description: string
} {
  if (score >= 30) {
    return {
      label: "Must Do",
      color: "green",
      priority: 1,
      description: "Critical priority - implement immediately",
    }
  }

  if (score >= 15) {
    return {
      label: "Should Do",
      color: "yellow",
      priority: 2,
      description: "High priority - implement soon",
    }
  }

  if (score >= 5) {
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
 * Calculate the actual contribution of each component to the final score
 * Shows how much each factor contributes to the total score value
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
  // Calculate the actual score
  const actualScore = calculateRiceScore(params)

  // If score is 0, all contributions are 0
  if (actualScore === 0) {
    return { reach: 0, impact: 0, confidence: 0, effort: 0 }
  }

  // Calculate what the score would be with each component at its minimum value
  // This shows how much each component adds to the score

  // Reach contribution: difference between actual score and score with reach=1
  const scoreWithMinReach = calculateRiceScore({ ...params, reach: 1 })
  const reachContribution = actualScore - scoreWithMinReach

  // Impact contribution: difference between actual score and score with impact=1
  const scoreWithMinImpact = calculateRiceScore({ ...params, impact: 1 })
  const impactContribution = actualScore - scoreWithMinImpact

  // Confidence contribution: difference between actual score and score with confidence=10%
  const scoreWithMinConfidence = calculateRiceScore({ ...params, confidence: 10 })
  const confidenceContribution = actualScore - scoreWithMinConfidence

  // Effort contribution: how much the score would increase with effort=1
  const scoreWithMinEffort = calculateRiceScore({ ...params, effort: 1 })
  const effortContribution = scoreWithMinEffort - actualScore

  return {
    reach: Math.max(0, reachContribution),
    impact: Math.max(0, impactContribution),
    confidence: Math.max(0, confidenceContribution),
    effort: Math.max(0, effortContribution),
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

  // Reach insights (1-10 scale)
  if (reach <= 3) {
    insights.push("Limited reach - suitable for testing or niche features")
  } else if (reach >= 8) {
    insights.push("Excellent reach! This will impact a large user base")
  }

  // Impact insights (1-10 scale)
  if (impact <= 3) {
    insights.push("Low impact score - ensure this aligns with strategic goals")
  } else if (impact >= 7) {
    insights.push("High impact feature that will significantly improve user experience")
  }

  // Confidence insights
  if (confidence < 50) {
    insights.push("Low confidence - consider more research or prototyping")
  } else if (confidence >= 80) {
    insights.push("High confidence level indicates good validation")
  }

  // Effort insights (1-10 scale)
  if (effort >= 7) {
    insights.push("High effort requirement - consider breaking into smaller features")
  } else if (effort <= 3) {
    insights.push("Low effort - great candidate for quick wins")
  }

  // Score optimization insights
  if (score < 5 && effort > 5) {
    insights.push("High effort for low score - reconsider scope or deprioritize")
  }

  if (score > 20 && effort <= 3) {
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
