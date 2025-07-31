import { useState } from "react"
import type { RiceScore } from "~/types"
import { RICE_IMPACT_VALUES } from "~/types"
import { BaseWidget } from "./BaseWidget"

interface RiceCalculatorProps {
  widgetId: string
  widgetConfig?: Record<string, unknown>
}

export default function RiceCalculator({ widgetId, widgetConfig }: RiceCalculatorProps) {
  const [formData, setFormData] = useState({
    reach: 0,
    impact: RICE_IMPACT_VALUES.MEDIUM,
    confidence: 0.5,
    effort: 1,
  })

  const calculateScore = (): RiceScore => {
    const score = (formData.reach * formData.impact * formData.confidence) / formData.effort
    return {
      id: Date.now().toString(),
      name: "Quick Calculation",
      ...formData,
      score: Math.round(score * 10) / 10,
      savedAt: new Date(),
    }
  }

  const currentScore = calculateScore()

  return (
    <BaseWidget
      widgetId={widgetId}
      title="RICE Score Calculator"
      data={currentScore}
      settings={widgetConfig}
      onSettings={() => console.log("Settings clicked")}
    >
      {(data) => (
        <div className="p-4 space-y-4">
          {/* Reach */}
          <div>
            <label
              htmlFor="reach"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Reach (users/month)
            </label>
            <input
              id="reach"
              type="number"
              value={formData.reach}
              onChange={(e) => setFormData({ ...formData, reach: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              min="0"
            />
          </div>

          {/* Impact */}
          <div>
            <label
              htmlFor="impact"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Impact
            </label>
            <select
              id="impact"
              value={formData.impact}
              onChange={(e) => setFormData({ ...formData, impact: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value={RICE_IMPACT_VALUES.MINIMAL}>Minimal (0.25)</option>
              <option value={RICE_IMPACT_VALUES.LOW}>Low (0.5)</option>
              <option value={RICE_IMPACT_VALUES.MEDIUM}>Medium (1)</option>
              <option value={RICE_IMPACT_VALUES.HIGH}>High (2)</option>
              <option value={RICE_IMPACT_VALUES.MASSIVE}>Massive (3)</option>
            </select>
          </div>

          {/* Confidence */}
          <div>
            <label
              htmlFor="confidence"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Confidence ({Math.round(formData.confidence * 100)}%)
            </label>
            <input
              id="confidence"
              type="range"
              value={formData.confidence}
              onChange={(e) => setFormData({ ...formData, confidence: Number(e.target.value) })}
              className="w-full"
              min="0"
              max="1"
              step="0.1"
            />
          </div>

          {/* Effort */}
          <div>
            <label
              htmlFor="effort"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Effort (person-months)
            </label>
            <input
              id="effort"
              type="number"
              value={formData.effort}
              onChange={(e) => setFormData({ ...formData, effort: Number(e.target.value) || 1 })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              min="0.1"
              step="0.1"
            />
          </div>

          {/* Score Display */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">RICE Score</p>
              <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                {data.score}
              </p>
            </div>
          </div>
        </div>
      )}
    </BaseWidget>
  )
}
