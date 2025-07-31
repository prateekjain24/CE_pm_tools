import { useStorage } from "@plasmohq/storage/hook"
import { lazy, Suspense, useCallback, useState } from "react"
import { Button } from "~/components/common/Button"
import { Input } from "~/components/common/Input"
import { Select } from "~/components/common/Select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/common/Tabs"
import { calculateBottomUp, calculateTopDown } from "~/lib/calculators/tam"
import type { Currency, MarketCalculationParams, MarketSegment, TamCalculation } from "~/types"
import { BaseWidget } from "./BaseWidget"
import { WidgetSkeleton } from "./WidgetSkeleton"

// Lazy load components
const TopDownCalculator = lazy(() =>
  import("./tam/TopDownCalculator").then((m) => ({ default: m.TopDownCalculator }))
)
const BottomUpCalculator = lazy(() =>
  import("./tam/BottomUpCalculator").then((m) => ({ default: m.BottomUpCalculator }))
)
const MarketFunnel = lazy(() =>
  import("./tam/MarketFunnel").then((m) => ({ default: m.MarketFunnel }))
)
const TamHistory = lazy(() => import("./tam/TamHistory").then((m) => ({ default: m.TamHistory })))

interface TamCalculatorProps {
  widgetId: string
  widgetConfig?: Record<string, unknown>
}

export default function TamCalculator({ widgetId, widgetConfig }: TamCalculatorProps) {
  const [calculations, setCalculations] = useStorage<TamCalculation[]>("tam-history", [])
  const [method, setMethod] = useState<"topDown" | "bottomUp">("topDown")
  const [currency, setCurrency] = useState<Currency>("USD")
  const [marketName, setMarketName] = useState("")
  const [marketDescription, setMarketDescription] = useState("")
  const [showHistory, setShowHistory] = useState(false)

  // Market parameters
  const [marketParams, setMarketParams] = useState<MarketCalculationParams>({
    currency: "USD",
    timePeriod: "annual",
    geographicScope: "global",
    marketMaturity: "growing",
    competitorCount: 5,
    marketShareTarget: 10,
  })

  // Top-down values
  const [topDownValues, setTopDownValues] = useState({
    tam: 0,
    samPercentage: 10,
    somPercentage: 10,
  })

  // Bottom-up values
  const [segments, setSegments] = useState<MarketSegment[]>([])

  // Calculate current market sizes
  const calculateMarkets = useCallback(() => {
    try {
      if (method === "topDown") {
        // Return empty result if TAM is not set
        if (topDownValues.tam <= 0) {
          return { tam: 0, sam: 0, som: 0, method: "topDown", assumptions: [], confidence: 0 }
        }
        return calculateTopDown({
          tam: topDownValues.tam,
          samPercentage: topDownValues.samPercentage,
          somPercentage: topDownValues.somPercentage,
          marketParams,
        })
      } else {
        if (segments.length === 0) {
          return { tam: 0, sam: 0, som: 0, method: "bottomUp", assumptions: [], confidence: 0 }
        }
        return calculateBottomUp({
          segments,
          marketParams,
          competitorCount: marketParams.competitorCount || 5,
          marketShareTarget: marketParams.marketShareTarget || 10,
        })
      }
    } catch (error) {
      console.error("Calculation error:", error)
      return { tam: 0, sam: 0, som: 0, method, assumptions: [], confidence: 0 }
    }
  }, [method, topDownValues, segments, marketParams])

  const currentMarketSizes = calculateMarkets()

  // Save calculation
  const handleSave = useCallback(() => {
    if (!marketName.trim()) {
      alert("Please enter a market name")
      return
    }

    const newCalculation: TamCalculation = {
      id: Date.now().toString(),
      name: marketName,
      description: marketDescription,
      method,
      currency,
      tam: currentMarketSizes.tam,
      sam: currentMarketSizes.sam,
      som: currentMarketSizes.som,
      samPercentage: method === "topDown" ? topDownValues.samPercentage : undefined,
      somPercentage: method === "topDown" ? topDownValues.somPercentage : undefined,
      segments: method === "bottomUp" ? segments : undefined,
      params: marketParams,
      savedAt: new Date(),
      assumptions: currentMarketSizes.assumptions,
      confidence: currentMarketSizes.confidence,
    }

    setCalculations([newCalculation, ...calculations.slice(0, 99)]) // Keep last 100
    alert("Calculation saved!")
  }, [
    marketName,
    marketDescription,
    method,
    currency,
    currentMarketSizes,
    topDownValues,
    segments,
    marketParams,
    calculations,
    setCalculations,
  ])

  // Reset form
  const handleReset = useCallback(() => {
    setMarketName("")
    setMarketDescription("")
    setTopDownValues({ tam: 0, samPercentage: 10, somPercentage: 10 })
    setSegments([])
  }, [])

  // Load calculation from history
  const handleLoadCalculation = useCallback(
    (calc: TamCalculation) => {
      setMarketName(calc.name)
      setMarketDescription(calc.description || "")
      setMethod(calc.method)
      setCurrency(calc.currency)
      setMarketParams(calc.params || marketParams)

      if (calc.method === "topDown") {
        setTopDownValues({
          tam: calc.tam,
          samPercentage: calc.samPercentage || 10,
          somPercentage: calc.somPercentage || 10,
        })
      } else {
        setSegments(calc.segments || [])
      }

      setShowHistory(false)
    },
    [marketParams]
  )

  // Update market params with currency
  const handleCurrencyChange = useCallback((newCurrency: Currency) => {
    setCurrency(newCurrency)
    setMarketParams((prev) => ({ ...prev, currency: newCurrency }))
  }, [])

  return (
    <BaseWidget
      widgetId={widgetId}
      title="TAM/SAM/SOM Calculator"
      data={currentMarketSizes}
      settings={widgetConfig}
      onSettings={widgetConfig?.onSettings as () => void}
      onHide={widgetConfig?.onHide as () => void}
      icon={
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <title>TAM/SAM/SOM Calculator</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      }
    >
      {(data) => (
        <div className="p-6 space-y-6">
          {/* Market Context */}
          <div className="space-y-4">
            <Input
              label="Market Name"
              value={marketName}
              onChange={(e) => setMarketName(e.target.value)}
              placeholder="e.g., Global CRM Software Market"
              helperText="Give your market analysis a descriptive name"
            />

            <div className="flex gap-4">
              <Select
                label="Currency"
                value={currency}
                onChange={(e) => handleCurrencyChange(e.target.value as Currency)}
                className="w-32"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="INR">INR (₹)</option>
              </Select>

              <Select
                label="Time Period"
                value={marketParams.timePeriod}
                onChange={(e) =>
                  setMarketParams((prev) => ({
                    ...prev,
                    timePeriod: e.target.value as "monthly" | "quarterly" | "annual",
                  }))
                }
                className="w-40"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
              </Select>

              <Select
                label="Market Maturity"
                value={marketParams.marketMaturity}
                onChange={(e) =>
                  setMarketParams((prev) => ({
                    ...prev,
                    marketMaturity: e.target.value as
                      | "emerging"
                      | "growing"
                      | "mature"
                      | "declining",
                  }))
                }
                className="w-40"
              >
                <option value="emerging">Emerging</option>
                <option value="growing">Growing</option>
                <option value="mature">Mature</option>
                <option value="declining">Declining</option>
              </Select>
            </div>
          </div>

          {/* Calculation Method Tabs */}
          <Tabs value={method} onValueChange={(v) => setMethod(v as "topDown" | "bottomUp")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="topDown">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <title>Top-Down Method</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                  Top-Down
                </div>
              </TabsTrigger>
              <TabsTrigger value="bottomUp">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <title>Bottom-Up Method</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 10l7-7m0 0l7 7m-7-7v18"
                    />
                  </svg>
                  Bottom-Up
                </div>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="topDown" className="mt-4">
              <Suspense fallback={<WidgetSkeleton title="Loading..." />}>
                <TopDownCalculator
                  values={topDownValues}
                  onChange={setTopDownValues}
                  currency={currency}
                />
              </Suspense>
            </TabsContent>

            <TabsContent value="bottomUp" className="mt-4">
              <Suspense fallback={<WidgetSkeleton title="Loading..." />}>
                <BottomUpCalculator
                  segments={segments}
                  onChange={setSegments}
                  currency={currency}
                  marketParams={marketParams}
                />
              </Suspense>
            </TabsContent>
          </Tabs>

          {/* Market Funnel Visualization */}
          {(data.tam > 0 || data.sam > 0 || data.som > 0) && (
            <Suspense fallback={<WidgetSkeleton title="Loading visualization..." />}>
              <MarketFunnel values={data} currency={currency} interactive={true} />
            </Suspense>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button variant="primary" onClick={handleSave}>
              Save Calculation
            </Button>
            <Button variant="secondary" onClick={handleReset}>
              Reset
            </Button>
            <Button variant="ghost" onClick={() => setShowHistory(true)}>
              History ({calculations.length})
            </Button>
          </div>

          {/* History Modal */}
          {showHistory && (
            <Suspense fallback={<WidgetSkeleton title="Loading history..." />}>
              <TamHistory
                calculations={calculations}
                onLoad={handleLoadCalculation}
                onClose={() => setShowHistory(false)}
                onDelete={(id) => setCalculations(calculations.filter((calc) => calc.id !== id))}
              />
            </Suspense>
          )}
        </div>
      )}
    </BaseWidget>
  )
}
