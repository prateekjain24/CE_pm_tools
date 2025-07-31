import { useCallback } from "react"
import { Input } from "~/components/common/Input"
import { formatCurrency, parseCurrencyInput } from "~/lib/calculators/tam"
import type { Currency } from "~/types"
import { PercentageSlider } from "./PercentageSlider"

interface TopDownCalculatorProps {
  values: {
    tam: number
    samPercentage: number
    somPercentage: number
  }
  onChange: (values: { tam: number; samPercentage: number; somPercentage: number }) => void
  currency: Currency
}

export function TopDownCalculator({ values, onChange, currency }: TopDownCalculatorProps) {
  const sam = values.tam * (values.samPercentage / 100)
  const som = sam * (values.somPercentage / 100)

  const handleTamChange = useCallback(
    (value: string) => {
      const numValue = parseCurrencyInput(value)
      onChange({ ...values, tam: numValue })
    },
    [values, onChange]
  )

  const handleSamPercentageChange = useCallback(
    (percentage: number) => {
      onChange({ ...values, samPercentage: percentage })
    },
    [values, onChange]
  )

  const handleSomPercentageChange = useCallback(
    (percentage: number) => {
      onChange({ ...values, somPercentage: percentage })
    },
    [values, onChange]
  )

  const handleSamAbsoluteChange = useCallback(
    (newSam: number) => {
      if (values.tam > 0) {
        const newPercentage = (newSam / values.tam) * 100
        onChange({ ...values, samPercentage: Math.min(100, Math.max(0, newPercentage)) })
      }
    },
    [values, onChange]
  )

  const handleSomAbsoluteChange = useCallback(
    (newSom: number) => {
      if (sam > 0) {
        const newPercentage = (newSom / sam) * 100
        onChange({ ...values, somPercentage: Math.min(100, Math.max(0, newPercentage)) })
      }
    },
    [values, sam, onChange]
  )

  return (
    <div className="space-y-6">
      {/* TAM Input */}
      <div>
        <Input
          label="Total Addressable Market (TAM)"
          type="text"
          value={values.tam > 0 ? formatCurrency(values.tam, currency, false) : ""}
          onChange={(e) => handleTamChange(e.target.value)}
          placeholder={`e.g., ${formatCurrency(1000000000, currency)}`}
          helperText="The total market demand for your product or service"
          className="text-lg font-semibold"
        />
      </div>

      {/* SAM Percentage Slider */}
      <PercentageSlider
        label="Serviceable Addressable Market (SAM)"
        value={values.samPercentage}
        onChange={handleSamPercentageChange}
        baseValue={values.tam}
        absoluteValue={sam}
        onAbsoluteChange={handleSamAbsoluteChange}
        helpText="The segment of TAM targeted by your products and within your geographical reach"
        showTypicalRange={true}
        benchmarks="sam"
      />

      {/* SOM Percentage Slider */}
      <PercentageSlider
        label="Serviceable Obtainable Market (SOM)"
        value={values.somPercentage}
        onChange={handleSomPercentageChange}
        baseValue={sam}
        absoluteValue={som}
        onAbsoluteChange={handleSomAbsoluteChange}
        helpText="The portion of SAM you can realistically capture in the near term"
        showTypicalRange={true}
        benchmarks="som"
      />

      {/* Summary */}
      {values.tam > 0 && (
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Market Size Summary
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">TAM:</span>
              <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {formatCurrency(values.tam, currency)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                SAM ({values.samPercentage.toFixed(1)}%):
              </span>
              <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                {formatCurrency(sam, currency)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                SOM ({values.somPercentage.toFixed(1)}%):
              </span>
              <span className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                {formatCurrency(som, currency)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
