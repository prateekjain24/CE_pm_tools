import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { createSafeAnimationProps, SafeMotionDiv } from "~/lib/animation/safeMotion"
import { calculateComponentContributions } from "~/lib/calculators/rice"

interface RiceBreakdownChartProps {
  reach: number
  impact: number
  confidence: number
  effort: number
  animated?: boolean
}

export default function RiceBreakdownChart({
  reach,
  impact,
  confidence,
  effort,
  animated = true,
}: RiceBreakdownChartProps) {
  const contributions = calculateComponentContributions({ reach, impact, confidence, effort })

  // Prepare data for the bar chart
  const data = [
    {
      name: "Reach",
      value: reach,
      normalized: contributions.reach,
      color: "#3b82f6",
      description: `${reach.toLocaleString()} users`,
    },
    {
      name: "Impact",
      value: impact,
      normalized: contributions.impact,
      color: "#10b981",
      description: `${impact}x multiplier`,
    },
    {
      name: "Confidence",
      value: confidence,
      normalized: contributions.confidence,
      color: "#f59e0b",
      description: `${confidence}% certainty`,
    },
    {
      name: "Effort",
      value: effort,
      normalized: contributions.effort,
      color: "#ef4444",
      description: `${effort} person-months`,
    },
  ]

  interface TooltipPayload {
    payload: {
      name: string
      description: string
      normalized: number
    }
  }

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-gray-900 text-white p-3 rounded-lg shadow-lg">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm text-gray-300">{data.description}</p>
          <p className="text-sm mt-1">Contribution: {Math.abs(data.normalized)}%</p>
        </div>
      )
    }
    return null
  }

  const chartMotion = createSafeAnimationProps(animated, "slideIn")

  return (
    <SafeMotionDiv className="rice-breakdown-chart space-y-4" {...chartMotion}>
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Component Breakdown
        </h3>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          How each factor contributes to your RICE score
        </p>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="name"
              tick={{ fill: "#6b7280", fontSize: 12 }}
              axisLine={{ stroke: "#e5e7eb" }}
            />
            <YAxis
              tick={{ fill: "#6b7280", fontSize: 12 }}
              axisLine={{ stroke: "#e5e7eb" }}
              label={{
                value: "Value",
                angle: -90,
                position: "insideLeft",
                style: { fill: "#6b7280", fontSize: 12 },
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" animationDuration={animated ? 1000 : 0} radius={[8, 8, 0, 0]}>
              {data.map((entry) => (
                <Cell key={`cell-${entry.name}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Component Impact Summary */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
            Positive Factors
          </h4>
          {data
            .filter((d) => d.normalized >= 0 && d.name !== "Effort")
            .map((item) => (
              <SafeMotionDiv
                key={item.name}
                className="flex items-center justify-between text-sm"
                {...(animated
                  ? {
                      initial: { x: -20, opacity: 0 },
                      animate: { x: 0, opacity: 1 },
                      transition: { duration: 0.3, delay: 0.1 },
                    }
                  : {})}
              >
                <span className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: item.color }}
                  />
                  {item.name}
                </span>
                <span className="font-medium" style={{ color: item.color }}>
                  +{item.normalized}%
                </span>
              </SafeMotionDiv>
            ))}
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
            Limiting Factors
          </h4>
          {data
            .filter((d) => d.name === "Effort" && d.normalized < 0)
            .map((item) => (
              <SafeMotionDiv
                key={item.name}
                className="flex items-center justify-between text-sm"
                {...(animated
                  ? {
                      initial: { x: 20, opacity: 0 },
                      animate: { x: 0, opacity: 1 },
                      transition: { duration: 0.3, delay: 0.1 },
                    }
                  : {})}
              >
                <span className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: item.color }}
                  />
                  {item.name}
                </span>
                <span className="font-medium" style={{ color: item.color }}>
                  {item.normalized}%
                </span>
              </SafeMotionDiv>
            ))}
          {effort <= 1 && (
            <div className="text-xs text-gray-500 dark:text-gray-400 italic">
              Low effort - no negative impact
            </div>
          )}
        </div>
      </div>
    </SafeMotionDiv>
  )
}
