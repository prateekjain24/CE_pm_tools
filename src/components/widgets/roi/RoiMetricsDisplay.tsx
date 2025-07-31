import { formatCurrency, getRoiCategory } from "~/lib/calculators/roi"
import type { Currency, RoiMetrics } from "~/types"

interface RoiMetricsDisplayProps {
  metrics: RoiMetrics
  currency: Currency
  timeHorizon: number
}

export function RoiMetricsDisplay({ metrics, currency, timeHorizon }: RoiMetricsDisplayProps) {
  const roiCategory = getRoiCategory(metrics.simpleRoi)

  // Helper to get color classes based on category
  const getCategoryColors = (color: string) => {
    const colorMap = {
      green:
        "text-green-600 bg-green-100 border-green-500 dark:text-green-400 dark:bg-green-900/30",
      blue: "text-blue-600 bg-blue-100 border-blue-500 dark:text-blue-400 dark:bg-blue-900/30",
      yellow:
        "text-yellow-600 bg-yellow-100 border-yellow-500 dark:text-yellow-400 dark:bg-yellow-900/30",
      orange:
        "text-orange-600 bg-orange-100 border-orange-500 dark:text-orange-400 dark:bg-orange-900/30",
      red: "text-red-600 bg-red-100 border-red-500 dark:text-red-400 dark:bg-red-900/30",
    }
    return colorMap[color as keyof typeof colorMap] || colorMap.blue
  }

  const categoryColors = getCategoryColors(roiCategory.color)

  return (
    <div className="space-y-4">
      {/* Main ROI Score */}
      <div className={`text-center p-6 rounded-lg border-2 ${categoryColors}`}>
        <div className="text-4xl font-bold mb-2">{metrics.simpleRoi.toFixed(1)}%</div>
        <div className="text-lg font-medium">{roiCategory.label} ROI</div>
        <div className="text-sm mt-1 opacity-80">{roiCategory.description}</div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        <MetricCard
          label="Net Present Value (NPV)"
          value={formatCurrency(metrics.npv, currency)}
          positive={metrics.npv > 0}
          helperText={`at ${metrics.irr > 0 ? metrics.irr.toFixed(1) : "0"}% discount rate`}
        />

        <MetricCard
          label="Internal Rate of Return (IRR)"
          value={`${metrics.irr.toFixed(1)}%`}
          positive={metrics.irr > 10}
          helperText="Annualized return rate"
        />

        <MetricCard
          label="Payback Period"
          value={
            metrics.paybackPeriod <= timeHorizon
              ? `${metrics.paybackPeriod.toFixed(1)} months`
              : `> ${timeHorizon} months`
          }
          positive={metrics.paybackPeriod <= timeHorizon}
          helperText="Time to recover investment"
        />

        <MetricCard
          label="Break-even Month"
          value={
            metrics.breakEvenMonth > 0 ? `Month ${metrics.breakEvenMonth}` : "Not within horizon"
          }
          positive={metrics.breakEvenMonth > 0 && metrics.breakEvenMonth <= timeHorizon}
          helperText="When cash flow turns positive"
        />
      </div>

      {/* Additional Metrics */}
      {(metrics.pi !== undefined || metrics.mirr !== undefined) && (
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          {metrics.pi !== undefined && (
            <MetricCard
              label="Profitability Index (PI)"
              value={metrics.pi.toFixed(2)}
              positive={metrics.pi > 1}
              helperText="Value per unit invested"
            />
          )}

          {metrics.mirr !== undefined && (
            <MetricCard
              label="Modified IRR (MIRR)"
              value={`${metrics.mirr.toFixed(1)}%`}
              positive={metrics.mirr > 10}
              helperText="Adjusted for reinvestment"
            />
          )}

          {metrics.discountedPaybackPeriod !== undefined && (
            <MetricCard
              label="Discounted Payback"
              value={
                metrics.discountedPaybackPeriod <= timeHorizon
                  ? `${metrics.discountedPaybackPeriod.toFixed(1)} months`
                  : `> ${timeHorizon} months`
              }
              positive={metrics.discountedPaybackPeriod <= timeHorizon}
              helperText="Considering time value"
            />
          )}

          {metrics.eva !== undefined && (
            <MetricCard
              label="Economic Value Added"
              value={formatCurrency(metrics.eva, currency)}
              positive={metrics.eva > 0}
              helperText="Value after cost of capital"
            />
          )}
        </div>
      )}
    </div>
  )
}

interface MetricCardProps {
  label: string
  value: string
  positive?: boolean
  helperText?: string
}

function MetricCard({ label, value, positive, helperText }: MetricCardProps) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{label}</div>
      <div
        className={`text-2xl font-semibold ${
          positive === undefined
            ? "text-gray-900 dark:text-gray-100"
            : positive
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
        }`}
      >
        {value}
      </div>
      {helperText && (
        <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">{helperText}</div>
      )}
    </div>
  )
}
