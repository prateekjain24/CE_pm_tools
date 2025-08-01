import { useCallback, useMemo, useState } from "react"
import { calculateFrequentistSampleSize, calculateMDE } from "~/lib/calculators/abtest"
import type { SampleSizeInputs, TestConfig } from "~/types"

interface SampleSizeCalculatorProps {
  config: TestConfig
  variations: Array<{ id: string; name: string }>
}

export function SampleSizeCalculator({ config, variations }: SampleSizeCalculatorProps) {
  const [inputs, setInputs] = useState<SampleSizeInputs>({
    method: config.statisticalMethod,
    metric: {
      type: "binary",
      baseline: 5, // 5% baseline conversion rate
      variance: undefined,
    },
    effect: {
      type: "relative",
      value: 20, // 20% relative improvement
      practicalSignificance: 5,
    },
    statisticalParams: {
      confidenceLevel: config.confidenceLevel,
      power: 80,
      testDirection: config.testDirection,
      multipleComparisons: variations.length > 2 ? variations.length - 1 : undefined,
    },
    traffic: {
      daily: 1000,
      allocation: variations.reduce(
        (acc, v) => {
          acc[v.id] = 100 / variations.length
          return acc
        },
        {} as Record<string, number>
      ),
    },
  })

  const [showAdvanced, setShowAdvanced] = useState(false)

  // Calculate sample size
  const sampleSizeResult = useMemo(() => {
    try {
      if (inputs.method === "frequentist") {
        return calculateFrequentistSampleSize(inputs)
      }
      return null
    } catch (error) {
      console.error("Error calculating sample size:", error)
      return null
    }
  }, [inputs])

  // Calculate MDE for current sample size
  const currentMDE = useMemo(() => {
    if (!sampleSizeResult) return null

    try {
      const sampleSize =
        sampleSizeResult.perVariation[Object.keys(sampleSizeResult.perVariation)[0]]
      const mde = calculateMDE(
        sampleSize,
        inputs.metric.baseline / 100,
        1 - inputs.statisticalParams.confidenceLevel / 100,
        inputs.statisticalParams.power / 100,
        inputs.statisticalParams.testDirection
      )
      return mde * 100 // Convert to percentage
    } catch {
      return null
    }
  }, [sampleSizeResult, inputs])

  const updateMetric = useCallback((updates: Partial<typeof inputs.metric>) => {
    setInputs((prev) => ({
      ...prev,
      metric: { ...prev.metric, ...updates },
    }))
  }, [])

  const updateEffect = useCallback((updates: Partial<typeof inputs.effect>) => {
    setInputs((prev) => ({
      ...prev,
      effect: { ...prev.effect, ...updates },
    }))
  }, [])

  const updateStatisticalParams = useCallback(
    (updates: Partial<typeof inputs.statisticalParams>) => {
      setInputs((prev) => ({
        ...prev,
        statisticalParams: { ...prev.statisticalParams, ...updates },
      }))
    },
    []
  )

  const updateTraffic = useCallback((updates: Partial<typeof inputs.traffic>) => {
    setInputs((prev) => ({
      ...prev,
      traffic: { ...prev.traffic, ...updates },
    }))
  }, [])

  return (
    <div className="space-y-6">
      {/* Basic Inputs */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Basic Parameters</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="baseline-rate"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Baseline Conversion Rate (%)
            </label>
            <input
              id="baseline-rate"
              type="number"
              value={inputs.metric.baseline}
              onChange={(e) => updateMetric({ baseline: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
              min="0"
              max="100"
              step="0.1"
            />
            <p className="mt-1 text-xs text-gray-500">Your current conversion rate</p>
          </div>

          <div>
            <label
              htmlFor="mde-value"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Minimum Detectable Effect (%)
            </label>
            <div className="flex gap-2">
              <select
                value={inputs.effect.type}
                onChange={(e) => updateEffect({ type: e.target.value as "absolute" | "relative" })}
                className="w-24 px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 text-sm"
              >
                <option value="relative">Relative</option>
                <option value="absolute">Absolute</option>
              </select>
              <input
                id="mde-value"
                type="number"
                value={inputs.effect.value}
                onChange={(e) => updateEffect({ value: parseFloat(e.target.value) || 0 })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                min="0"
                step="1"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {inputs.effect.type === "relative"
                ? "Percentage change you want to detect"
                : "Absolute percentage point change"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="power"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Statistical Power (%)
            </label>
            <input
              id="power"
              type="number"
              value={inputs.statisticalParams.power}
              onChange={(e) => updateStatisticalParams({ power: parseFloat(e.target.value) || 80 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
              min="50"
              max="99"
              step="5"
            />
            <p className="mt-1 text-xs text-gray-500">Probability of detecting true effect</p>
          </div>

          <div>
            <label
              htmlFor="traffic"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Daily Traffic (visitors)
            </label>
            <input
              id="traffic"
              type="number"
              value={inputs.traffic.daily}
              onChange={(e) => updateTraffic({ daily: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
              min="1"
              step="100"
            />
            <p className="mt-1 text-xs text-gray-500">Average daily visitors to test</p>
          </div>
        </div>
      </div>

      {/* Advanced Options */}
      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
        >
          <svg
            className={`w-4 h-4 transition-transform ${showAdvanced ? "rotate-90" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          Advanced Options
        </button>

        {showAdvanced && (
          <div className="mt-4 space-y-4 pl-6">
            <div>
              <label
                htmlFor="practical-threshold"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Practical Significance Threshold (%)
              </label>
              <input
                id="practical-threshold"
                type="number"
                value={inputs.effect.practicalSignificance || ""}
                onChange={(e) =>
                  updateEffect({
                    practicalSignificance: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                min="0"
                step="1"
                placeholder="Optional"
              />
              <p className="mt-1 text-xs text-gray-500">
                Minimum effect size that's practically meaningful
              </p>
            </div>

            <div>
              <div className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Traffic Allocation
              </div>
              <div className="space-y-2">
                {variations.map((variation) => (
                  <div key={variation.id} className="flex items-center gap-2">
                    <span className="text-sm w-24">{variation.name}:</span>
                    <input
                      type="number"
                      value={inputs.traffic.allocation[variation.id] || 0}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0
                        updateTraffic({
                          allocation: {
                            ...inputs.traffic.allocation,
                            [variation.id]: value,
                          },
                        })
                      }}
                      className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                      min="0"
                      max="100"
                      step="5"
                    />
                    <span className="text-sm text-gray-600">%</span>
                  </div>
                ))}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Must sum to 100%. Equal split recommended.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {sampleSizeResult && (
        <div className="border-t pt-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Sample Size Requirements
          </h3>

          <div className="space-y-4">
            {/* Per Variation */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Required Sample Size
              </h4>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(sampleSizeResult.perVariation).map(([varId, size]) => {
                  const variation = variations.find((v) => v.id === varId)
                  return (
                    <div key={varId}>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {variation?.name || varId}:
                      </span>
                      <p className="text-lg font-semibold">{size.toLocaleString()} visitors</p>
                    </div>
                  )
                })}
              </div>
              <div className="mt-3 pt-3 border-t">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Sample Size:</span>
                <p className="text-lg font-semibold">
                  {sampleSizeResult.total.toLocaleString()} visitors
                </p>
              </div>
            </div>

            {/* Duration */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-3">
                Estimated Test Duration
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="text-sm text-blue-600 dark:text-blue-400">Days:</span>
                  <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                    {sampleSizeResult.duration.days}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-blue-600 dark:text-blue-400">Weeks:</span>
                  <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                    {sampleSizeResult.duration.weeks}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-blue-600 dark:text-blue-400">Range:</span>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    {sampleSizeResult.duration.confidenceInterval[0]}-
                    {sampleSizeResult.duration.confidenceInterval[1]} days
                  </p>
                </div>
              </div>
            </div>

            {/* MDE Check */}
            {currentMDE && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                <h4 className="text-sm font-medium text-yellow-700 dark:text-yellow-300 mb-2">
                  Detectable Effect Size
                </h4>
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  With this sample size, you can detect a minimum {inputs.effect.type} effect of{" "}
                  <span className="font-semibold">{currentMDE.toFixed(1)}%</span>
                </p>
              </div>
            )}

            {/* Notes */}
            {sampleSizeResult.notes.length > 0 && (
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p className="font-medium">Notes:</p>
                <ul className="list-disc list-inside">
                  {sampleSizeResult.notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <h4 className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">
                Recommendations
              </h4>
              <ul className="text-sm text-green-600 dark:text-green-400 space-y-1">
                <li>• Run test for at least one full business cycle</li>
                <li>• Avoid stopping test early based on "peeking"</li>
                <li>• Consider running test longer for more reliable results</li>
                {sampleSizeResult.duration.weeks > 4 && (
                  <li>• Long test duration - consider increasing MDE threshold</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
