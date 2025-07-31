import { useState } from "react"
import { formatCurrency } from "~/lib/calculators/tam"
import type { Currency, IndustryBenchmark } from "~/types"

interface PercentageSliderProps {
  label: string
  value: number
  onChange: (value: number) => void
  baseValue?: number
  absoluteValue?: number
  onAbsoluteChange?: (value: number) => void
  helpText?: string
  min?: number
  max?: number
  showTypicalRange?: boolean
  benchmarks?: "sam" | "som"
  currency?: Currency
}

// Industry benchmark data
export const SAM_BENCHMARKS: IndustryBenchmark[] = [
  {
    label: "B2B SaaS",
    value: 10,
    description: "Typical for specialized B2B software",
    industries: ["saas", "b2b", "software"],
  },
  {
    label: "Consumer App",
    value: 25,
    description: "Broader reach for consumer products",
    industries: ["consumer", "mobile", "app"],
  },
  {
    label: "Enterprise",
    value: 5,
    description: "Focused on large enterprise customers",
    industries: ["enterprise", "b2b"],
  },
  {
    label: "Marketplace",
    value: 15,
    description: "Two-sided marketplace platforms",
    industries: ["marketplace", "platform"],
  },
]

export const SOM_BENCHMARKS: IndustryBenchmark[] = [
  {
    label: "New Entrant",
    value: 1,
    description: "Realistic for new market entrant",
    industries: ["all"],
  },
  {
    label: "Growing Startup",
    value: 5,
    description: "Established startup with traction",
    industries: ["all"],
  },
  {
    label: "Market Leader",
    value: 15,
    description: "Dominant player in the market",
    industries: ["all"],
  },
]

export function PercentageSlider({
  label,
  value,
  onChange,
  baseValue,
  absoluteValue,
  onAbsoluteChange,
  helpText,
  min = 0,
  max = 100,
  showTypicalRange = true,
  benchmarks,
  currency = "USD",
}: PercentageSliderProps) {
  const [isEditingAbsolute, setIsEditingAbsolute] = useState(false)
  const calculatedAbsolute = baseValue ? baseValue * (value / 100) : 0
  const displayAbsolute = absoluteValue ?? calculatedAbsolute

  const relevantBenchmarks =
    benchmarks === "sam" ? SAM_BENCHMARKS : benchmarks === "som" ? SOM_BENCHMARKS : []

  // Calculate typical range based on benchmarks
  const typicalRange =
    relevantBenchmarks.length > 0
      ? {
          min: Math.min(...relevantBenchmarks.map((b) => b.value)),
          max: Math.max(...relevantBenchmarks.map((b) => b.value)),
        }
      : null

  const handleAbsoluteChange = (newValue: string) => {
    const numValue = parseFloat(newValue.replace(/[^0-9.]/g, ""))
    if (!Number.isNaN(numValue) && baseValue && onAbsoluteChange) {
      const newPercentage = Math.round((numValue / baseValue) * 1000) / 10
      onChange(Math.min(100, Math.max(0, newPercentage)))
      onAbsoluteChange(numValue)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
          {helpText && (
            <div className="group relative">
              <svg
                className="w-4 h-4 text-gray-400 cursor-help"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <title>Help</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 max-w-xs whitespace-normal">
                  {helpText}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                    <div className="border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="text-sm text-right">
          <div className="font-semibold text-gray-900 dark:text-gray-100">{value.toFixed(1)}%</div>
          {baseValue && baseValue > 0 && (
            <div className="text-gray-500 dark:text-gray-400">
              {isEditingAbsolute ? (
                <input
                  type="text"
                  value={displayAbsolute}
                  onChange={(e) => handleAbsoluteChange(e.target.value)}
                  onBlur={() => setIsEditingAbsolute(false)}
                  className="w-24 px-1 py-0 text-right border-b border-gray-300 bg-transparent"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingAbsolute(true)}
                  className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                  {formatCurrency(displayAbsolute, currency)}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step="0.1"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
          style={{
            background:
              showTypicalRange && typicalRange
                ? `linear-gradient(to right, 
                    #e5e7eb 0%, 
                    #e5e7eb ${(typicalRange.min / max) * 100}%, 
                    #dbeafe ${(typicalRange.min / max) * 100}%, 
                    #dbeafe ${(typicalRange.max / max) * 100}%, 
                    #e5e7eb ${(typicalRange.max / max) * 100}%, 
                    #e5e7eb 100%)`
                : undefined,
          }}
        />

        {showTypicalRange && typicalRange && (
          <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-xs text-gray-500">
            <span
              style={{ left: `${(typicalRange.min / max) * 100}%` }}
              className="absolute transform -translate-x-1/2"
            >
              {typicalRange.min}%
            </span>
            <span
              style={{ left: `${(typicalRange.max / max) * 100}%` }}
              className="absolute transform -translate-x-1/2"
            >
              {typicalRange.max}%
            </span>
          </div>
        )}
      </div>

      {relevantBenchmarks.length > 0 && (
        <div className="space-y-2 mt-6">
          <p className="text-xs text-gray-600 dark:text-gray-400">Industry benchmarks:</p>
          <div className="flex flex-wrap gap-2">
            {relevantBenchmarks.map((benchmark) => (
              <div key={benchmark.value} className="group relative">
                <button
                  type="button"
                  onClick={() => onChange(benchmark.value)}
                  className={`text-xs px-3 py-1.5 rounded-md transition-all ${
                    Math.abs(value - benchmark.value) < 0.5
                      ? "bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  {benchmark.label} ({benchmark.value}%)
                </button>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                  <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 max-w-xs whitespace-normal">
                    {benchmark.description}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                      <div className="border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
