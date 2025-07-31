import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { calculateMonthlyProjections, formatCurrency } from "~/lib/calculators/roi"
import type { Currency, RoiCalculation } from "~/types"

interface RoiTimelineProps {
  calculation: RoiCalculation
  currency: Currency
}

export function RoiTimeline({ calculation, currency }: RoiTimelineProps) {
  const projections = calculateMonthlyProjections(calculation)

  // Prepare data for charts
  const chartData = projections.map((proj) => ({
    month: `M${proj.month}`,
    monthNumber: proj.month,
    costs: -proj.costs, // Negative for visualization
    benefits: proj.benefits,
    netCashFlow: proj.netCashFlow,
    cumulative: proj.cumulativeCashFlow,
  }))

  // Find break-even point
  const breakEvenMonth = projections.findIndex((p) => p.cumulativeCashFlow >= 0) + 1

  // Custom tooltip
  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean
    payload?: Array<{ payload: any; value: number }>
    label?: string
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-medium mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <p className="text-red-600 dark:text-red-400">
              Costs: {formatCurrency(Math.abs(data.costs), currency)}
            </p>
            <p className="text-green-600 dark:text-green-400">
              Benefits: {formatCurrency(data.benefits, currency)}
            </p>
            <p
              className={
                data.netCashFlow >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }
            >
              Net: {formatCurrency(data.netCashFlow, currency)}
            </p>
            <p
              className={
                data.cumulative >= 0
                  ? "text-blue-600 dark:text-blue-400 font-medium"
                  : "text-gray-600 dark:text-gray-400"
              }
            >
              Cumulative: {formatCurrency(data.cumulative, currency)}
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Cash Flow Timeline</h3>

      {/* Monthly Cash Flow */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
          Monthly Cash Flow
        </h4>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorBenefits" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorCosts" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.8} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
            <XAxis dataKey="month" className="text-xs" tick={{ fill: "currentColor" }} />
            <YAxis
              className="text-xs"
              tick={{ fill: "currentColor" }}
              tickFormatter={(value) => formatCurrency(value, currency)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="3 3" />
            <Area
              type="monotone"
              dataKey="benefits"
              stroke="#10b981"
              fillOpacity={1}
              fill="url(#colorBenefits)"
              name="Benefits"
            />
            <Area
              type="monotone"
              dataKey="costs"
              stroke="#ef4444"
              fillOpacity={1}
              fill="url(#colorCosts)"
              name="Costs"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Cumulative Cash Flow */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
          Cumulative Cash Flow & Break-even Analysis
        </h4>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
            <XAxis dataKey="month" className="text-xs" tick={{ fill: "currentColor" }} />
            <YAxis
              className="text-xs"
              tick={{ fill: "currentColor" }}
              tickFormatter={(value) => formatCurrency(value, currency)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="3 3" />
            {breakEvenMonth > 0 && breakEvenMonth <= calculation.timeHorizon && (
              <ReferenceLine
                x={`M${breakEvenMonth}`}
                stroke="#f59e0b"
                strokeDasharray="5 5"
                label={{
                  value: "Break-even",
                  position: "top",
                  fill: "#f59e0b",
                  fontSize: 12,
                }}
              />
            )}
            <Line
              type="monotone"
              dataKey="cumulative"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={false}
              name="Cumulative Cash Flow"
            />
            <Line
              type="monotone"
              dataKey="netCashFlow"
              stroke="#8b5cf6"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Net Monthly Flow"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <div className="text-gray-600 dark:text-gray-400">Total Investment</div>
          <div className="text-lg font-semibold text-red-600 dark:text-red-400">
            {formatCurrency(
              calculation.initialCost +
                calculation.recurringCosts.reduce(
                  (sum, cost) => sum + (cost.isRecurring ? cost.amount * cost.months : cost.amount),
                  0
                ),
              currency
            )}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <div className="text-gray-600 dark:text-gray-400">Total Returns</div>
          <div className="text-lg font-semibold text-green-600 dark:text-green-400">
            {formatCurrency(
              calculation.benefits.reduce((sum, benefit) => {
                const probability = (benefit.probability ?? 100) / 100
                return (
                  sum +
                  (benefit.isRecurring ? benefit.amount * benefit.months : benefit.amount) *
                    probability
                )
              }, 0),
              currency
            )}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <div className="text-gray-600 dark:text-gray-400">Final Position</div>
          <div
            className={`text-lg font-semibold ${
              projections[projections.length - 1]?.cumulativeCashFlow >= 0
                ? "text-blue-600 dark:text-blue-400"
                : "text-orange-600 dark:text-orange-400"
            }`}
          >
            {formatCurrency(projections[projections.length - 1]?.cumulativeCashFlow || 0, currency)}
          </div>
        </div>
      </div>
    </div>
  )
}
