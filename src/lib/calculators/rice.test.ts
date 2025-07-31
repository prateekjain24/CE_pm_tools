import { describe, expect, test } from "@jest/globals"
import type { RiceScore } from "~/types"
import {
  calculateRiceScore,
  compareRiceScores,
  formatRiceScore,
  generateRiceInsights,
  getRiceScoreCategory,
} from "./rice"

describe("RICE Calculator", () => {
  describe("calculateRiceScore", () => {
    test("calculates score correctly with standard inputs", () => {
      const score = calculateRiceScore({
        reach: 1000,
        impact: 2,
        confidence: 80,
        effort: 3,
      })
      // (1000 * 2 * 0.8) / 3 = 533.3
      expect(score).toBe(533.3)
    })

    test("handles decimal values correctly", () => {
      const score = calculateRiceScore({
        reach: 500,
        impact: 0.5,
        confidence: 50,
        effort: 0.5,
      })
      // (500 * 0.5 * 0.5) / 0.5 = 250
      expect(score).toBe(250.0)
    })

    test("rounds to 1 decimal place", () => {
      const score = calculateRiceScore({
        reach: 100,
        impact: 1,
        confidence: 33,
        effort: 1,
      })
      // (100 * 1 * 0.33) / 1 = 33
      expect(score).toBe(33.0)
    })

    test("throws error for negative values", () => {
      expect(() =>
        calculateRiceScore({
          reach: -100,
          impact: 1,
          confidence: 50,
          effort: 1,
        })
      ).toThrow("Invalid input values")
    })

    test("throws error for zero effort", () => {
      expect(() =>
        calculateRiceScore({
          reach: 100,
          impact: 1,
          confidence: 50,
          effort: 0,
        })
      ).toThrow("Invalid input values")
    })

    test("throws error for confidence over 100", () => {
      expect(() =>
        calculateRiceScore({
          reach: 100,
          impact: 1,
          confidence: 150,
          effort: 1,
        })
      ).toThrow("Confidence cannot exceed 100%")
    })

    test("handles zero reach/impact/confidence", () => {
      const score = calculateRiceScore({
        reach: 0,
        impact: 1,
        confidence: 50,
        effort: 1,
      })
      expect(score).toBe(0)
    })
  })

  describe("getRiceScoreCategory", () => {
    test("categorizes Must Do correctly", () => {
      const category = getRiceScoreCategory(150)
      expect(category.label).toBe("Must Do")
      expect(category.color).toBe("green")
      expect(category.priority).toBe(1)
    })

    test("categorizes Should Do correctly", () => {
      const category = getRiceScoreCategory(75)
      expect(category.label).toBe("Should Do")
      expect(category.color).toBe("yellow")
      expect(category.priority).toBe(2)
    })

    test("categorizes Could Do correctly", () => {
      const category = getRiceScoreCategory(25)
      expect(category.label).toBe("Could Do")
      expect(category.color).toBe("orange")
      expect(category.priority).toBe(3)
    })

    test("categorizes Won't Do correctly", () => {
      const category = getRiceScoreCategory(10)
      expect(category.label).toBe("Won't Do")
      expect(category.color).toBe("red")
      expect(category.priority).toBe(4)
    })

    test("handles boundary values", () => {
      expect(getRiceScoreCategory(100).label).toBe("Must Do")
      expect(getRiceScoreCategory(50).label).toBe("Should Do")
      expect(getRiceScoreCategory(20).label).toBe("Could Do")
      expect(getRiceScoreCategory(19.9).label).toBe("Won't Do")
    })
  })

  describe("formatRiceScore", () => {
    test("formats score with 1 decimal place", () => {
      expect(formatRiceScore(123.456)).toBe("123.5")
      expect(formatRiceScore(100)).toBe("100.0")
      expect(formatRiceScore(0.1)).toBe("0.1")
    })
  })

  describe("generateRiceInsights", () => {
    test("generates insights for high-scoring feature", () => {
      const insights = generateRiceInsights({
        reach: 5000,
        impact: 3,
        confidence: 90,
        effort: 2,
        score: 675,
      })

      expect(insights).toContain('This feature is a "Must Do" priority with a score of 675')
      expect(insights).toContain(
        "High impact feature that will significantly improve user experience"
      )
      expect(insights).toContain("High confidence level indicates good validation")
      expect(insights).toContain("Excellent ROI - low effort with high impact")
    })

    test("generates insights for low-scoring feature", () => {
      const insights = generateRiceInsights({
        reach: 50,
        impact: 0.25,
        confidence: 30,
        effort: 5,
        score: 0.8,
      })

      expect(insights).toContain('This feature is a "Won\'t Do" priority with a score of 0.8')
      expect(insights).toContain("Consider ways to increase reach to impact more users")
      expect(insights).toContain("Low impact score - ensure this aligns with strategic goals")
      expect(insights).toContain("Low confidence - consider more research or prototyping")
    })
  })

  describe("compareRiceScores", () => {
    test("compares scores correctly", () => {
      const scoreA: RiceScore = {
        id: "1",
        name: "Feature A",
        reach: 1000,
        impact: 2,
        confidence: 0.8,
        effort: 2,
        score: 80,
        savedAt: new Date(),
      }

      const scoreB: RiceScore = {
        id: "2",
        name: "Feature B",
        reach: 500,
        impact: 1,
        confidence: 0.5,
        effort: 1,
        score: 25,
        savedAt: new Date(),
      }

      const comparison = compareRiceScores(scoreA, scoreB)
      expect(comparison.winner.name).toBe("Feature A")
      expect(comparison.difference).toBe(55)
      expect(comparison.recommendation).toContain("significantly better")
    })
  })

  describe("getScoreDistribution", () => {
    test("calculates distribution correctly", () => {
      const calculations: RiceScore[] = [
        {
          id: "1",
          name: "A",
          reach: 0,
          impact: 0,
          confidence: 0,
          effort: 1,
          score: 150,
          savedAt: new Date(),
        },
        {
          id: "2",
          name: "B",
          reach: 0,
          impact: 0,
          confidence: 0,
          effort: 1,
          score: 75,
          savedAt: new Date(),
        },
        {
          id: "3",
          name: "C",
          reach: 0,
          impact: 0,
          confidence: 0,
          effort: 1,
          score: 25,
          savedAt: new Date(),
        },
        {
          id: "4",
          name: "D",
          reach: 0,
          impact: 0,
          confidence: 0,
          effort: 1,
          score: 10,
          savedAt: new Date(),
        },
      ]

      const distribution = getScoreDistribution(calculations)
      expect(distribution.mustDo).toBe(1)
      expect(distribution.shouldDo).toBe(1)
      expect(distribution.couldDo).toBe(1)
      expect(distribution.wontDo).toBe(1)
    })
  })
})
