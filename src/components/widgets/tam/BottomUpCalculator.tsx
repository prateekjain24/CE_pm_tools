import { useCallback } from "react"
import { Button } from "~/components/common/Button"
import { Input } from "~/components/common/Input"
import { formatCurrency, parseCurrencyInput } from "~/lib/calculators/tam"
import type { Currency, MarketCalculationParams, MarketSegment } from "~/types"

interface BottomUpCalculatorProps {
  segments: MarketSegment[]
  onChange: (segments: MarketSegment[]) => void
  currency: Currency
  marketParams: MarketCalculationParams
}

export function BottomUpCalculator({
  segments,
  onChange,
  currency,
  marketParams,
}: BottomUpCalculatorProps) {
  const addSegment = useCallback(() => {
    const newSegment: MarketSegment = {
      id: Date.now().toString(),
      name: `Segment ${segments.length + 1}`,
      users: 0,
      avgPrice: 0,
      growthRate: 10,
      penetrationRate: 50,
    }
    onChange([...segments, newSegment])
  }, [segments, onChange])

  const updateSegment = useCallback(
    (index: number, field: keyof MarketSegment, value: string | number) => {
      const newSegments = [...segments]
      if (field === "name") {
        newSegments[index] = { ...newSegments[index], [field]: value as string }
      } else if (field === "avgPrice") {
        newSegments[index] = { ...newSegments[index], [field]: parseCurrencyInput(value as string) }
      } else {
        newSegments[index] = { ...newSegments[index], [field]: parseFloat(value as string) || 0 }
      }
      onChange(newSegments)
    },
    [segments, onChange]
  )

  const removeSegment = useCallback(
    (index: number) => {
      onChange(segments.filter((_, i) => i !== index))
    },
    [segments, onChange]
  )

  const calculateSegmentValue = (segment: MarketSegment) => {
    return segment.users * segment.avgPrice
  }

  const calculateAddressableValue = (segment: MarketSegment) => {
    return calculateSegmentValue(segment) * (segment.penetrationRate / 100)
  }

  const totalTAM = segments.reduce((sum, segment) => sum + calculateSegmentValue(segment), 0)
  const totalSAM = segments.reduce((sum, segment) => sum + calculateAddressableValue(segment), 0)
  const competitiveAdjustment = 1 / ((marketParams.competitorCount || 5) + 1)
  const totalSOM = totalSAM * ((marketParams.marketShareTarget || 10) / 100) * competitiveAdjustment

  return (
    <div className="space-y-6">
      {/* Market Parameters Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          Market parameters are configured in the main calculator. Current settings:
        </p>
        <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-blue-600 dark:text-blue-400">Competitors:</span>{" "}
            <span className="font-medium">{marketParams.competitorCount || 5}</span>
          </div>
          <div>
            <span className="text-blue-600 dark:text-blue-400">Target Share:</span>{" "}
            <span className="font-medium">{marketParams.marketShareTarget || 10}%</span>
          </div>
        </div>
      </div>

      {/* Segments */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Market Segments</h4>
          <Button size="sm" variant="secondary" onClick={addSegment}>
            + Add Segment
          </Button>
        </div>

        {segments.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              No segments added yet. Add segments to calculate bottom-up market size.
            </p>
            <Button variant="primary" onClick={addSegment}>
              Add First Segment
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {segments.map((segment, index) => (
              <div
                key={segment.id || index}
                className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <Input
                    label="Segment Name"
                    value={segment.name}
                    onChange={(e) => updateSegment(index, "name", e.target.value)}
                    className="flex-1 mr-4"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeSegment(index)}
                    className="mt-6"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <title>Remove segment</title>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Number of Users"
                    type="number"
                    value={segment.users || ""}
                    onChange={(e) => updateSegment(index, "users", e.target.value)}
                    min="0"
                    helperText="Total potential users"
                  />
                  <Input
                    label="Average Price per User"
                    type="text"
                    value={
                      segment.avgPrice > 0 ? formatCurrency(segment.avgPrice, currency, false) : ""
                    }
                    onChange={(e) => updateSegment(index, "avgPrice", e.target.value)}
                    helperText="Annual revenue per user"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Annual Growth Rate (%)"
                    type="number"
                    value={segment.growthRate || ""}
                    onChange={(e) => updateSegment(index, "growthRate", e.target.value)}
                    min="0"
                    max="100"
                    step="0.1"
                    helperText="Expected yearly growth"
                  />
                  <Input
                    label="Penetration Rate (%)"
                    type="number"
                    value={segment.penetrationRate || ""}
                    onChange={(e) => updateSegment(index, "penetrationRate", e.target.value)}
                    min="0"
                    max="100"
                    step="0.1"
                    helperText="% of segment you can serve"
                  />
                </div>

                {/* Segment Summary */}
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Segment Value:</span>
                    <span className="font-medium">
                      {formatCurrency(calculateSegmentValue(segment), currency)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Addressable Value:</span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      {formatCurrency(calculateAddressableValue(segment), currency)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Total Summary */}
      {segments.length > 0 && (
        <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-medium text-primary-900 dark:text-primary-100">
            Market Size Calculation
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-primary-700 dark:text-primary-300">
                Total TAM ({segments.length} segments):
              </span>
              <span className="text-lg font-semibold text-primary-900 dark:text-primary-100">
                {formatCurrency(totalTAM, currency)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-primary-700 dark:text-primary-300">
                Total SAM (addressable):
              </span>
              <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                {formatCurrency(totalSAM, currency)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-primary-700 dark:text-primary-300">
                Total SOM (obtainable):
              </span>
              <span className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                {formatCurrency(totalSOM, currency)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
