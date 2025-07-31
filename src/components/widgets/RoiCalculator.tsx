import { useStorage } from "@plasmohq/storage/hook"
import { lazy, Suspense, useCallback, useState } from "react"
import { Button } from "~/components/common/Button"
import { Input } from "~/components/common/Input"
import { Select } from "~/components/common/Select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/common/Tabs"
import { getFieldError, useRoiValidation } from "~/hooks/useRoiValidation"
import { calculateRoiMetrics } from "~/lib/calculators/roi"
import { exportRoiToPDF } from "~/lib/export/roiExport"
import type { Currency, LineItem, RoiCalculation, TimePeriod } from "~/types"
import { BaseWidget } from "./BaseWidget"
import { WidgetSkeleton } from "./WidgetSkeleton"

// Lazy load components
const CostBenefitInputs = lazy(() =>
  import("./roi/CostBenefitInputs").then((m) => ({ default: m.CostBenefitInputs }))
)
const RoiMetricsDisplay = lazy(() =>
  import("./roi/RoiMetricsDisplay").then((m) => ({ default: m.RoiMetricsDisplay }))
)
const RoiHistory = lazy(() => import("./roi/RoiHistory").then((m) => ({ default: m.RoiHistory })))
const RoiTimeline = lazy(() =>
  import("./roi/RoiTimeline").then((m) => ({ default: m.RoiTimeline }))
)

interface RoiCalculatorProps {
  widgetId: string
  widgetConfig?: Record<string, unknown>
}

export default function RoiCalculator({ widgetId, widgetConfig }: RoiCalculatorProps) {
  const [calculations, setCalculations] = useStorage<RoiCalculation[]>("roi-history", [])
  const [showHistory, setShowHistory] = useState(false)

  // Form state
  const [projectName, setProjectName] = useState("")
  const [projectDescription, setProjectDescription] = useState("")
  const [initialCost, setInitialCost] = useState(0)
  const [timeHorizon, setTimeHorizon] = useState(12) // Default 12 months
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("monthly")
  const [discountRate, setDiscountRate] = useState(10) // Default 10% annual
  const [currency, setCurrency] = useState<Currency>("USD")
  const [costs, setCosts] = useState<LineItem[]>([])
  const [benefits, setBenefits] = useState<LineItem[]>([])

  // Validation
  const validation = useRoiValidation(
    projectName,
    initialCost,
    costs,
    benefits,
    timeHorizon,
    discountRate
  )

  // Calculate current metrics
  const calculateCurrentMetrics = useCallback(() => {
    const calculation: RoiCalculation = {
      id: Date.now().toString(),
      name: projectName || "Unnamed Project",
      description: projectDescription,
      initialCost,
      recurringCosts: costs,
      benefits,
      timeHorizon,
      timePeriod,
      discountRate,
      currency,
      savedAt: new Date(),
    }

    const metrics = calculateRoiMetrics(calculation)
    return { calculation, metrics }
  }, [
    projectName,
    projectDescription,
    initialCost,
    costs,
    benefits,
    timeHorizon,
    timePeriod,
    discountRate,
    currency,
  ])

  const { calculation: currentCalculation, metrics: currentMetrics } = calculateCurrentMetrics()

  // Save calculation
  const handleSave = useCallback(() => {
    if (!projectName.trim()) {
      alert("Please enter a project name")
      return
    }

    const calculationWithMetrics = {
      ...currentCalculation,
      metrics: currentMetrics,
    }

    setCalculations((prev) => [calculationWithMetrics, ...prev])

    // Reset form
    setProjectName("")
    setProjectDescription("")
    setInitialCost(0)
    setCosts([])
    setBenefits([])
    setTimeHorizon(12)
    setDiscountRate(10)
  }, [currentCalculation, currentMetrics, projectName, setCalculations])

  // Load calculation from history
  const handleLoadCalculation = useCallback((calculation: RoiCalculation) => {
    setProjectName(calculation.name)
    setProjectDescription(calculation.description || "")
    setInitialCost(calculation.initialCost)
    setCosts(calculation.recurringCosts)
    setBenefits(calculation.benefits)
    setTimeHorizon(calculation.timeHorizon)
    setTimePeriod(calculation.timePeriod)
    setDiscountRate(calculation.discountRate)
    setCurrency(calculation.currency)
    setShowHistory(false)
  }, [])

  return (
    <BaseWidget
      widgetId={widgetId}
      title="ROI Calculator"
      data={currentCalculation}
      settings={widgetConfig}
      onSettings={widgetConfig?.onSettings as () => void}
      onHide={widgetConfig?.onHide as () => void}
      icon={
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <title>ROI Calculator</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      }
    >
      {() => (
        <div className="p-6 space-y-6">
          {/* Validation Summary */}
          {validation.errors.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                Please fix the following errors:
              </h4>
              <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-300 space-y-1">
                {validation.errors.map((error) => (
                  <li key={`${error.field}-${error.message}`}>{error.message}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestions */}
          {validation.suggestions.length > 0 && validation.errors.length === 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                Suggestions:
              </h4>
              <ul className="list-disc list-inside text-sm text-blue-700 dark:text-blue-300 space-y-1">
                {validation.suggestions.map((suggestion) => (
                  <li key={suggestion}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Project Information */}
          <div className="space-y-4">
            <Input
              label="Project Name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g., New CRM Implementation"
              required
              error={getFieldError(validation.errors, "projectName")}
            />

            <textarea
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-600"
              placeholder="Project description (optional)"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Time and Financial Parameters */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <Input
                label="Initial Investment"
                type="number"
                value={initialCost}
                onChange={(e) => setInitialCost(parseFloat(e.target.value) || 0)}
                min={0}
                step={1000}
                helperText="One-time upfront cost"
              />

              <Input
                label="Time Horizon (months)"
                type="number"
                value={timeHorizon}
                onChange={(e) => setTimeHorizon(parseInt(e.target.value) || 12)}
                min={1}
                max={120}
                helperText="Analysis period"
              />

              <Select
                label="Time Period"
                value={timePeriod}
                onChange={(e) => setTimePeriod(e.target.value as TimePeriod)}
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
              </Select>
            </div>

            <div className="space-y-4">
              <Input
                label="Discount Rate (%)"
                type="number"
                value={discountRate}
                onChange={(e) => setDiscountRate(parseFloat(e.target.value) || 0)}
                min={0}
                max={50}
                step={0.5}
                helperText="Annual rate for NPV"
              />

              <Select
                label="Currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="INR">INR (₹)</option>
              </Select>
            </div>
          </div>

          {/* Costs and Benefits */}
          <Suspense fallback={<WidgetSkeleton />}>
            <CostBenefitInputs
              costs={costs}
              benefits={benefits}
              onCostsChange={setCosts}
              onBenefitsChange={setBenefits}
              currency={currency}
              timeHorizon={timeHorizon}
            />
          </Suspense>

          {/* Metrics Display and Timeline */}
          {(costs.length > 0 || benefits.length > 0 || initialCost > 0) && (
            <Tabs defaultValue="metrics" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="metrics">Metrics</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
              </TabsList>

              <TabsContent value="metrics" className="mt-4">
                <Suspense fallback={<WidgetSkeleton />}>
                  <RoiMetricsDisplay
                    metrics={currentMetrics}
                    currency={currency}
                    timeHorizon={timeHorizon}
                  />
                </Suspense>
              </TabsContent>

              <TabsContent value="timeline" className="mt-4">
                <Suspense fallback={<WidgetSkeleton />}>
                  <RoiTimeline calculation={currentCalculation} currency={currency} />
                </Suspense>
              </TabsContent>
            </Tabs>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={!validation.isValid}
              title={!validation.isValid ? "Fix validation errors before saving" : ""}
            >
              Save Calculation
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setProjectName("")
                setProjectDescription("")
                setInitialCost(0)
                setCosts([])
                setBenefits([])
                setTimeHorizon(12)
                setDiscountRate(10)
              }}
            >
              Reset
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowHistory(true)}
              disabled={calculations.length === 0}
            >
              History ({calculations.length})
            </Button>
            {(costs.length > 0 || benefits.length > 0 || initialCost > 0) && (
              <Button
                variant="outline"
                onClick={() => exportRoiToPDF(currentCalculation, currentMetrics)}
                title="Export current calculation to PDF"
              >
                Export PDF
              </Button>
            )}
          </div>

          {/* History Modal */}
          {showHistory && (
            <Suspense fallback={<WidgetSkeleton />}>
              <RoiHistory
                calculations={calculations}
                onClose={() => setShowHistory(false)}
                onLoad={handleLoadCalculation}
                onDelete={(id) => {
                  setCalculations((prev) => prev.filter((calc) => calc.id !== id))
                }}
                currency={currency}
              />
            </Suspense>
          )}
        </div>
      )}
    </BaseWidget>
  )
}
