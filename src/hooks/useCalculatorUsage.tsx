import { useStorage } from "@plasmohq/storage/hook"
import { type ReactNode, useCallback } from "react"
import type { CalculatorType } from "~/types/messages"

interface CalculatorUsage {
  [key: string]: number
}

interface CalculatorInfo {
  id: CalculatorType
  name: string
  description: string
  icon: ReactNode
  usageCount: number
  isNew?: boolean
  isPro?: boolean
}

export const CALCULATOR_DEFINITIONS: Record<
  CalculatorType,
  Omit<CalculatorInfo, "usageCount" | "icon">
> = {
  rice: {
    id: "rice",
    name: "RICE Score",
    description: "Prioritize features by Reach, Impact, Confidence & Effort",
    isNew: true,
  },
  roi: {
    id: "roi",
    name: "ROI Calculator",
    description: "Calculate return on investment for initiatives",
    isPro: true,
  },
  tam: {
    id: "tam",
    name: "TAM/SAM/SOM",
    description: "Market sizing calculator for business planning",
    isPro: true,
  },
  abTest: {
    id: "abTest",
    name: "A/B Test",
    description: "Statistical significance calculator for experiments",
    isPro: true,
  },
}

// Icon components
const CALCULATOR_ICONS: Record<CalculatorType, ReactNode> = {
  rice: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  ),
  roi: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  tam: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  abTest: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
      />
    </svg>
  ),
}

export function useCalculatorUsage() {
  const [usage, setUsage] = useStorage<CalculatorUsage>("calculator-usage", {})

  // Track calculator usage
  const trackUsage = useCallback(
    (calculatorId: CalculatorType) => {
      setUsage((prev) => ({
        ...prev,
        [calculatorId]: (prev[calculatorId] || 0) + 1,
      }))
    },
    [setUsage]
  )

  // Get calculators sorted by usage
  const getCalculatorsByUsage = useCallback((): CalculatorInfo[] => {
    const calculators = Object.entries(CALCULATOR_DEFINITIONS).map(([id, def]) => ({
      ...def,
      icon: CALCULATOR_ICONS[id as CalculatorType],
      usageCount: usage[id] || 0,
    }))

    // Sort by usage count (descending)
    return calculators.sort((a, b) => b.usageCount - a.usageCount)
  }, [usage])

  // Get top N most used calculators
  const getTopCalculators = useCallback(
    (count: number): CalculatorInfo[] => {
      return getCalculatorsByUsage().slice(0, count)
    },
    [getCalculatorsByUsage]
  )

  // Reset usage statistics
  const resetUsage = useCallback(() => {
    setUsage({})
  }, [setUsage])

  return {
    usage,
    trackUsage,
    getCalculatorsByUsage,
    getTopCalculators,
    resetUsage,
  }
}
