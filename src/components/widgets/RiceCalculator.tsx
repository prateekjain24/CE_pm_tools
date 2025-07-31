import { useStorage } from "@plasmohq/storage/hook"
import { lazy, Suspense, useCallback, useMemo, useState } from "react"
import { Button } from "~/components/common/Button"
import { Input } from "~/components/common/Input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/common/Tabs"
import { getFieldError, useRiceValidation, validateProjectName } from "~/hooks/useRiceValidation"
import { calculateRiceScore, formatRiceScore, getRiceScoreCategory } from "~/lib/calculators/rice"
import type { RiceScore } from "~/types"
import { RICE_IMPACT_VALUES } from "~/types"
import { BaseWidget } from "./BaseWidget"
import { WidgetSkeleton } from "./WidgetSkeleton"

// Lazy load visualization components
const RiceScoreDisplay = lazy(() =>
  import("./rice/RiceScoreDisplay").then((m) => ({ default: m.RiceScoreDisplay }))
)
const RiceBreakdownChart = lazy(() =>
  import("./rice/RiceBreakdownChart").then((m) => ({ default: m.RiceBreakdownChart }))
)
const RiceHistory = lazy(() =>
  import("./rice/RiceHistory").then((m) => ({ default: m.RiceHistory }))
)

interface RiceCalculatorProps {
  widgetId: string
  widgetConfig?: Record<string, unknown>
}

// Helper to format number with thousand separators
const formatNumber = (num: number): string => {
  return num.toLocaleString()
}

// Helper to get score category styling
const getScoreCategoryStyles = (score: number) => {
  const category = getRiceScoreCategory(score)
  const colorMap = {
    green: {
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      borderColor: "border-green-500",
    },
    yellow: {
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
      borderColor: "border-yellow-500",
    },
    orange: {
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-100 dark:bg-orange-900/30",
      borderColor: "border-orange-500",
    },
    red: {
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-100 dark:bg-red-900/30",
      borderColor: "border-red-500",
    },
  }
  return { ...category, ...colorMap[category.color as keyof typeof colorMap] }
}

export default function RiceCalculator({ widgetId, widgetConfig }: RiceCalculatorProps) {
  const [calculations, setCalculations] = useStorage<RiceScore[]>("rice-history", [])
  const [projectName, setProjectName] = useState("")
  const [formData, setFormData] = useState({
    reach: 0,
    impact: RICE_IMPACT_VALUES.MEDIUM,
    confidence: 50,
    effort: 1,
  })
  const [showHistory, setShowHistory] = useState(false)
  const [projectNameError, setProjectNameError] = useState<string>()

  // Validation
  const validation = useRiceValidation(formData)

  const calculateCurrentScore = useCallback((): RiceScore => {
    const score = calculateRiceScore({
      reach: formData.reach,
      impact: formData.impact,
      confidence: formData.confidence,
      effort: formData.effort,
    })

    return {
      id: Date.now().toString(),
      name: projectName || "Unnamed Calculation",
      reach: formData.reach,
      impact: formData.impact,
      confidence: formData.confidence / 100, // Store as decimal in RiceScore
      effort: formData.effort,
      score,
      savedAt: new Date(),
    }
  }, [formData, projectName])

  const currentScore = useMemo(() => calculateCurrentScore(), [calculateCurrentScore])
  const scoreCategory = useMemo(
    () => getScoreCategoryStyles(currentScore.score),
    [currentScore.score]
  )

  const handleSave = async () => {
    // Validate project name
    const nameValidation = validateProjectName(projectName)
    if (!nameValidation.isValid) {
      setProjectNameError(nameValidation.error)
      return
    }

    // Validate form data
    if (!validation.isValid) {
      alert("Please fix validation errors before saving")
      return
    }

    const newCalculation = calculateCurrentScore()
    await setCalculations([newCalculation, ...calculations.slice(0, 99)])
    setProjectNameError(undefined)
    alert("Calculation saved successfully!")
  }

  const handleReset = () => {
    setProjectName("")
    setProjectNameError(undefined)
    setFormData({
      reach: 0,
      impact: RICE_IMPACT_VALUES.MEDIUM,
      confidence: 50,
      effort: 1,
    })
  }

  const handleLoadCalculation = (calculation: RiceScore) => {
    setProjectName(calculation.name)
    setFormData({
      reach: calculation.reach,
      impact: calculation.impact,
      confidence: Math.round(calculation.confidence * 100), // Convert decimal to percentage
      effort: calculation.effort,
    })
    setShowHistory(false)
  }

  const handleDeleteCalculation = async (id: string) => {
    const updatedCalculations = calculations.filter((calc) => calc.id !== id)
    await setCalculations(updatedCalculations)
  }

  return (
    <BaseWidget
      widgetId={widgetId}
      title="RICE Score Calculator"
      data={currentScore}
      settings={widgetConfig}
      onSettings={widgetConfig?.onSettings as () => void}
      onHide={widgetConfig?.onHide as () => void}
      icon={
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <title>RICE Calculator</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
      }
    >
      {(data) => (
        <div className="p-6 space-y-6">
          {/* Project Name Input */}
          <Input
            label="Project Name"
            value={projectName}
            onChange={(e) => {
              setProjectName(e.target.value)
              setProjectNameError(undefined)
            }}
            placeholder="e.g., Dark Mode Feature"
            helperText="Give your calculation a memorable name"
            error={projectNameError}
            fullWidth
          />

          {/* Input Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Reach */}
            <div className="space-y-1">
              <label
                htmlFor="reach-input"
                className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                <svg
                  className="w-4 h-4 mr-1.5 text-primary-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <title>Reach</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                Reach
              </label>
              <Input
                id="reach-input"
                type="number"
                value={formData.reach || ""}
                onChange={(e) => setFormData({ ...formData, reach: Number(e.target.value) || 0 })}
                placeholder="0"
                min="0"
                helperText="How many users will this impact in the first quarter?"
                error={getFieldError(validation.errors, "reach")}
                fullWidth
              />
              {formData.reach > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatNumber(formData.reach)} users
                </p>
              )}
            </div>

            {/* Impact */}
            <div className="space-y-1">
              <label
                htmlFor="impact-select"
                className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                <svg
                  className="w-4 h-4 mr-1.5 text-primary-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <title>Impact</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Impact
              </label>
              <select
                id="impact-select"
                value={formData.impact}
                onChange={(e) => setFormData({ ...formData, impact: Number(e.target.value) })}
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value={RICE_IMPACT_VALUES.MINIMAL}>
                  Minimal (0.25) - Barely noticeable
                </option>
                <option value={RICE_IMPACT_VALUES.LOW}>Low (0.5) - Minor improvement</option>
                <option value={RICE_IMPACT_VALUES.MEDIUM}>Medium (1) - Moderate improvement</option>
                <option value={RICE_IMPACT_VALUES.HIGH}>High (2) - Major improvement</option>
                <option value={RICE_IMPACT_VALUES.MASSIVE}>Massive (3) - Game changer</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                How much will this improve the user experience?
              </p>
            </div>

            {/* Confidence */}
            <div className="space-y-1">
              <label
                htmlFor="confidence-slider"
                className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                <svg
                  className="w-4 h-4 mr-1.5 text-primary-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <title>Confidence</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Confidence ({formData.confidence}%)
              </label>
              <div className="space-y-2">
                <input
                  id="confidence-slider"
                  type="range"
                  value={formData.confidence}
                  onChange={(e) => setFormData({ ...formData, confidence: Number(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-primary-500"
                  min="0"
                  max="100"
                  step="10"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                How confident are you in your estimates?
              </p>
            </div>

            {/* Effort */}
            <div className="space-y-1">
              <label
                htmlFor="effort-input"
                className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                <svg
                  className="w-4 h-4 mr-1.5 text-primary-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <title>Effort</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Effort
              </label>
              <Input
                id="effort-input"
                type="number"
                value={formData.effort}
                onChange={(e) =>
                  setFormData({ ...formData, effort: Number(e.target.value) || 0.5 })
                }
                placeholder="1"
                min="0.5"
                step="0.5"
                helperText="Person-months required to build this"
                error={getFieldError(validation.errors, "effort")}
                fullWidth
              />
              {formData.effort > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formData.effort} {formData.effort === 1 ? "person-month" : "person-months"}
                </p>
              )}
            </div>
          </div>

          {/* Score Visualization */}
          <Tabs defaultValue="score" className="space-y-4">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="score">Score</TabsTrigger>
              <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
            </TabsList>

            <TabsContent value="score">
              <div
                className={`relative overflow-hidden rounded-xl p-6 border-2 ${scoreCategory.borderColor} ${scoreCategory.bgColor} transition-all duration-300`}
              >
                <Suspense fallback={<WidgetSkeleton lines={3} />}>
                  <RiceScoreDisplay
                    score={data.score}
                    breakdown={{
                      reach: formData.reach,
                      impact: formData.impact,
                      confidence: formData.confidence,
                      effort: formData.effort,
                    }}
                    animated={true}
                  />
                </Suspense>
              </div>
            </TabsContent>

            <TabsContent value="breakdown">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <Suspense fallback={<WidgetSkeleton lines={4} />}>
                  <RiceBreakdownChart
                    reach={formData.reach}
                    impact={formData.impact}
                    confidence={formData.confidence}
                    effort={formData.effort}
                    animated={true}
                  />
                </Suspense>
              </div>
            </TabsContent>
          </Tabs>

          {/* Validation Warnings */}
          {validation.warnings.length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-2 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <title>Warning</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                    Validation Warnings
                  </h4>
                  <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                    {validation.warnings.map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleSave}
              variant="primary"
              size="sm"
              disabled={!validation.isValid || validation.errors.length > 0}
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <title>Save</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                />
              </svg>
              Save
            </Button>
            <Button onClick={handleReset} variant="secondary" size="sm">
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <title>Reset</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Reset
            </Button>
            <Button onClick={() => setShowHistory(!showHistory)} variant="ghost" size="sm">
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <title>History</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              History ({calculations.length})
            </Button>
          </div>

          {/* History Modal */}
          {showHistory && (
            <Suspense fallback={<WidgetSkeleton lines={4} />}>
              <RiceHistory
                calculations={calculations}
                onClose={() => setShowHistory(false)}
                onLoad={handleLoadCalculation}
                onDelete={handleDeleteCalculation}
              />
            </Suspense>
          )}
        </div>
      )}
    </BaseWidget>
  )
}
