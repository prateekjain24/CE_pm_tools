import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { createSafeAnimationProps, SafeMotionDiv } from "~/lib/animation/safeMotion"
import { getRiceScoreCategory } from "~/lib/calculators/rice"

interface RiceScoreDisplayProps {
  score: number
  breakdown?: {
    reach: number
    impact: number
    confidence: number
    effort: number
  }
  animated?: boolean
}

// Color mapping for score categories
const categoryColors = {
  green: { primary: "#10b981", secondary: "#d1fae5" },
  yellow: { primary: "#f59e0b", secondary: "#fef3c7" },
  orange: { primary: "#f97316", secondary: "#fed7aa" },
  red: { primary: "#ef4444", secondary: "#fee2e2" },
}

export default function RiceScoreDisplay({
  score,
  breakdown,
  animated = true,
}: RiceScoreDisplayProps) {
  const category = getRiceScoreCategory(score)
  const colors = categoryColors[category.color as keyof typeof categoryColors]

  // Data for the semi-circular gauge
  const gaugeData = [
    { name: "Score", value: Math.min(score, 200), fill: colors.primary },
    { name: "Remaining", value: Math.max(0, 200 - score), fill: "#e5e7eb" },
  ]

  const scoreMotion = createSafeAnimationProps(animated, "scaleIn")
  const categoryMotion = createSafeAnimationProps(animated, "slideIn")

  return (
    <div className="rice-score-display space-y-4">
      {/* Gauge Chart */}
      <SafeMotionDiv className="relative h-48" {...scoreMotion}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={gaugeData}
              cx="50%"
              cy="70%"
              startAngle={180}
              endAngle={0}
              innerRadius="60%"
              outerRadius="90%"
              dataKey="value"
              stroke="none"
            >
              {gaugeData.map((entry) => (
                <Cell key={`cell-${entry.name}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => {
                if (value === score) return [`Score: ${value}`, ""]
                return null
              }}
              contentStyle={{
                backgroundColor: "rgba(17, 24, 39, 0.9)",
                border: "none",
                borderRadius: "0.5rem",
                color: "#f3f4f6",
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Score Text Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <SafeMotionDiv className="text-5xl font-bold" style={{ color: colors.primary }}>
            {score}
          </SafeMotionDiv>
          <SafeMotionDiv
            className="text-sm text-gray-600 dark:text-gray-400 mt-1"
            {...categoryMotion}
          >
            RICE Score
          </SafeMotionDiv>
        </div>
      </SafeMotionDiv>

      {/* Category Badge */}
      <SafeMotionDiv className="text-center" {...categoryMotion}>
        <div
          className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold"
          style={{
            backgroundColor: colors.secondary,
            color: colors.primary,
          }}
        >
          <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
            <title>{category.label}</title>
            {category.priority === 1 && (
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            )}
            {category.priority === 2 && (
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            )}
            {category.priority === 3 && (
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            )}
            {category.priority === 4 && (
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            )}
          </svg>
          {category.label}
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">{category.description}</p>
      </SafeMotionDiv>

      {/* Score Breakdown */}
      {breakdown && (
        <SafeMotionDiv
          className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-200 dark:border-gray-700"
          {...createSafeAnimationProps(animated, "fadeIn")}
        >
          <div className="text-center">
            <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {breakdown.reach.toLocaleString()}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Reach</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {breakdown.impact}×
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Impact</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {breakdown.confidence}%
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Confidence</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {breakdown.effort}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Effort</div>
          </div>
        </SafeMotionDiv>
      )}
    </div>
  )
}
