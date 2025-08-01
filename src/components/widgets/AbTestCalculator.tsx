import { useStorage } from "@plasmohq/storage/hook"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "~/components/common/Button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/common/Tabs"
import { SampleSizeCalculator } from "~/components/widgets/abtest/SampleSizeCalculator"
import { TestResultsVisualization } from "~/components/widgets/abtest/TestResultsVisualization"
import { BaseWidget } from "~/components/widgets/BaseWidget"
import {
  copyToClipboard,
  generateShareableLink,
  getTestFromURL,
  validateSharedTest,
} from "~/lib/abtest/urlSharing"
import { abTestExamples, type TestExample } from "~/lib/calculators/abTestExamples"
import { calculateFrequentist } from "~/lib/calculators/abtest"
import { exportToCSV, exportToJSON, exportToPDF } from "~/lib/export/abTestExport"
import type {
  SavedTest,
  StatisticalMethod,
  TestConfig,
  TestMetadata,
  TestResult,
  Variation,
} from "~/types"

interface AbTestCalculatorProps {
  widgetId: string
  widgetConfig?: Record<string, unknown>
}

export default function AbTestCalculator({ widgetId, widgetConfig }: AbTestCalculatorProps) {
  const [testHistory, setTestHistory] = useStorage<SavedTest[]>("abtest-history", [])
  const [showHistory, setShowHistory] = useState(false)
  const [showExamples, setShowExamples] = useState(false)
  const [_showExportMenu, setShowExportMenu] = useState(false)
  const [showShareToast, setShowShareToast] = useState(false)
  const [isSharedTest, setIsSharedTest] = useState(false)
  const [activeTab, setActiveTab] = useState<"setup" | "analysis" | "planning">("setup")

  const [currentTest, setCurrentTest] = useState<{
    config: TestConfig
    metadata: TestMetadata
    variations: Variation[]
  }>({
    config: {
      testType: "ab",
      metric: "conversion",
      statisticalMethod: "frequentist",
      confidenceLevel: 95,
      testDirection: "two-tailed",
      minimumEffect: 5,
      trafficAllocation: { control: 50, "variant-a": 50 },
      correctionMethod: "none",
    },
    metadata: {
      name: "",
      hypothesis: "",
      owner: "",
      stakeholders: [],
      tags: [],
      businessImpact: {
        metric: "",
        estimatedValue: 0,
        confidence: "medium",
      },
    },
    variations: [
      { id: "control", name: "Control", visitors: 0, conversions: 0 },
      { id: "variant-a", name: "Variant A", visitors: 0, conversions: 0 },
    ],
  })

  // Load shared test from URL on mount
  useEffect(() => {
    const sharedTest = getTestFromURL()
    if (sharedTest) {
      const errors = validateSharedTest(sharedTest)
      if (errors.length === 0) {
        setCurrentTest({
          config: sharedTest.config,
          metadata: sharedTest.metadata,
          variations: sharedTest.variations,
        })
        setIsSharedTest(true)
        setActiveTab("analysis")
      } else {
        console.error("Invalid shared test:", errors)
      }
    }
  }, [])

  // Calculate test results based on current data
  const testResults = useMemo(() => {
    if (currentTest.variations.some((v) => v.visitors === 0)) {
      return null
    }

    try {
      // Only calculate for frequentist method for now
      if (currentTest.config.statisticalMethod === "frequentist") {
        const results = calculateFrequentist(currentTest.variations, currentTest.config)
        return results
      }

      // Return null for other methods (will implement later)
      return null
    } catch (error) {
      console.error("Error calculating test results:", error)
      return null
    }
  }, [currentTest.variations, currentTest.config])

  const handleSaveTest = useCallback(async () => {
    const newTest: SavedTest = {
      id: Date.now().toString(),
      config: currentTest.config,
      metadata: currentTest.metadata,
      variations: currentTest.variations,
      savedAt: new Date(),
      status: "completed",
      results: testResults || undefined,
    }

    await setTestHistory([...testHistory, newTest])
  }, [currentTest, testHistory, setTestHistory, testResults])

  const handleReset = useCallback(() => {
    setCurrentTest({
      config: {
        testType: "ab",
        metric: "conversion",
        statisticalMethod: "frequentist",
        confidenceLevel: 95,
        testDirection: "two-tailed",
        minimumEffect: 5,
        trafficAllocation: { control: 50, "variant-a": 50 },
        correctionMethod: "none",
      },
      metadata: {
        name: "",
        hypothesis: "",
        owner: "",
        stakeholders: [],
        tags: [],
        businessImpact: {
          metric: "",
          estimatedValue: 0,
          confidence: "medium",
        },
      },
      variations: [
        { id: "control", name: "Control", visitors: 0, conversions: 0 },
        { id: "variant-a", name: "Variant A", visitors: 0, conversions: 0 },
      ],
    })
  }, [])

  const updateConfig = useCallback((updates: Partial<TestConfig>) => {
    setCurrentTest((prev) => ({
      ...prev,
      config: { ...prev.config, ...updates },
    }))
  }, [])

  const updateMetadata = useCallback((updates: Partial<TestMetadata>) => {
    setCurrentTest((prev) => ({
      ...prev,
      metadata: { ...prev.metadata, ...updates },
    }))
  }, [])

  const updateVariations = useCallback((variations: Variation[]) => {
    setCurrentTest((prev) => ({
      ...prev,
      variations,
    }))
  }, [])

  const loadExample = useCallback((example: TestExample) => {
    setCurrentTest({
      config: example.config,
      metadata: example.metadata,
      variations: example.variations,
    })
    setShowExamples(false)
    setActiveTab("analysis") // Switch to analysis tab to see results
  }, [])

  const handleExport = useCallback(
    (format: "csv" | "json" | "pdf") => {
      const testData = {
        config: currentTest.config,
        metadata: currentTest.metadata,
        variations: currentTest.variations,
      }

      switch (format) {
        case "csv":
          exportToCSV(testData, testResults)
          break
        case "json":
          exportToJSON(testData, testResults)
          break
        case "pdf":
          exportToPDF(testData, testResults)
          break
      }

      setShowExportMenu(false)
    },
    [currentTest, testResults]
  )

  const handleShare = useCallback(async () => {
    const testData = {
      config: currentTest.config,
      metadata: currentTest.metadata,
      variations: currentTest.variations,
      results: testResults || undefined,
    }

    const shareUrl = generateShareableLink(testData)
    const success = await copyToClipboard(shareUrl)

    if (success) {
      setShowShareToast(true)
      setTimeout(() => setShowShareToast(false), 3000)
    }
  }, [currentTest, testResults])

  return (
    <BaseWidget
      widgetId={widgetId}
      title="A/B Test Calculator"
      data={currentTest}
      settings={widgetConfig}
      onSettings={widgetConfig?.onSettings as () => void}
      icon={
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      }
    >
      {(_data) => (
        <div className="p-6 space-y-6">
          {/* Shared test indicator */}
          {isSharedTest && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Viewing shared test
                </span>
              </div>
              <Button
                size="xs"
                variant="ghost"
                onClick={() => {
                  handleReset()
                  setIsSharedTest(false)
                }}
                className="text-blue-600 hover:text-blue-700"
              >
                Clear
              </Button>
            </div>
          )}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="setup">Setup</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              <TabsTrigger value="planning">Planning</TabsTrigger>
            </TabsList>

            <TabsContent value="setup" className="space-y-4 mt-4">
              <TestSetupSection
                config={currentTest.config}
                metadata={currentTest.metadata}
                variations={currentTest.variations}
                onConfigUpdate={updateConfig}
                onMetadataUpdate={updateMetadata}
                onVariationsUpdate={updateVariations}
              />
            </TabsContent>

            <TabsContent value="analysis" className="space-y-4 mt-4">
              <TestAnalysisSection
                test={currentTest}
                results={testResults}
                onExport={handleExport}
                onShare={handleShare}
                hasData={currentTest.variations.some((v) => v.visitors > 0)}
              />
            </TabsContent>

            <TabsContent value="planning" className="space-y-4 mt-4">
              <TestPlanningSection
                config={currentTest.config}
                variations={currentTest.variations}
              />
            </TabsContent>
          </Tabs>

          <div className="flex items-center justify-between border-t pt-4">
            <div className="flex gap-2">
              <Button
                variant="primary"
                onClick={handleSaveTest}
                disabled={
                  !currentTest.metadata.name || currentTest.variations.some((v) => v.visitors === 0)
                }
              >
                Save Test
              </Button>
              <Button variant="secondary" onClick={handleReset}>
                Reset
              </Button>
            </div>

            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setShowExamples(true)} className="text-sm">
                Examples
              </Button>
              <Button variant="ghost" onClick={() => setShowHistory(true)} className="text-sm">
                History ({testHistory.length})
              </Button>
            </div>
          </div>

          {/* History Modal placeholder - will implement later */}
          {showHistory && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                <h2 className="text-xl font-semibold mb-4">Test History</h2>
                <p className="text-gray-600 dark:text-gray-400">History feature coming soon...</p>
                <Button variant="primary" onClick={() => setShowHistory(false)} className="mt-4">
                  Close
                </Button>
              </div>
            </div>
          )}

          {/* Examples Modal */}
          {showExamples && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Example A/B Tests</h2>
                  <button
                    type="button"
                    onClick={() => setShowExamples(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  {abTestExamples.map((example) => (
                    <button
                      type="button"
                      key={example.id}
                      className="w-full text-left border rounded-lg p-4 hover:border-primary-500 transition-colors"
                      onClick={() => loadExample(example)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                            {example.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {example.description}
                          </p>
                        </div>
                        <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                          {example.category}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm mt-3">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Visitors:</span>
                          <p className="font-medium">
                            {example.variations
                              .reduce((sum, v) => sum + v.visitors, 0)
                              .toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Test Type:</span>
                          <p className="font-medium uppercase">{example.config.testType}</p>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">
                            Statistical Method:
                          </span>
                          <p className="font-medium capitalize">
                            {example.config.statisticalMethod}
                          </p>
                        </div>
                      </div>

                      {example.insights && example.insights.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                            Key Insights:
                          </p>
                          <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-0.5">
                            {example.insights.slice(0, 2).map((insight) => (
                              <li key={insight}>• {insight}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <div className="mt-6 text-sm text-gray-600 dark:text-gray-400">
                  <p>Click on any example to load it into the calculator.</p>
                </div>
              </div>
            </div>
          )}

          {/* Share success toast */}
          {showShareToast && (
            <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>Share link copied to clipboard!</span>
            </div>
          )}
        </div>
      )}
    </BaseWidget>
  )
}

// Test Setup Section Component
function TestSetupSection({
  config,
  metadata,
  variations,
  onConfigUpdate,
  onMetadataUpdate,
  onVariationsUpdate,
}: {
  config: TestConfig
  metadata: TestMetadata
  variations: Variation[]
  onConfigUpdate: (updates: Partial<TestConfig>) => void
  onMetadataUpdate: (updates: Partial<TestMetadata>) => void
  onVariationsUpdate: (variations: Variation[]) => void
}) {
  return (
    <div className="space-y-6">
      {/* Test Metadata */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Test Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="test-name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Test Name
            </label>
            <input
              id="test-name"
              type="text"
              value={metadata.name}
              onChange={(e) => onMetadataUpdate({ name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
              placeholder="e.g., Checkout Button Color Test"
            />
          </div>

          <div>
            <label
              htmlFor="owner"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Owner
            </label>
            <input
              id="owner"
              type="text"
              value={metadata.owner}
              onChange={(e) => onMetadataUpdate({ owner: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
              placeholder="Your name"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="hypothesis"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Hypothesis
          </label>
          <textarea
            id="hypothesis"
            value={metadata.hypothesis}
            onChange={(e) => onMetadataUpdate({ hypothesis: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
            rows={3}
            placeholder="By changing X, we expect Y because Z..."
          />
        </div>
      </div>

      {/* Test Configuration */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Test Configuration
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="test-type"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Test Type
            </label>
            <select
              id="test-type"
              value={config.testType}
              onChange={(e) =>
                onConfigUpdate({ testType: e.target.value as TestConfig["testType"] })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="ab">A/B Test</option>
              <option value="abn">A/B/n Test</option>
              <option value="multivariate">Multivariate</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="metric"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Metric
            </label>
            <select
              id="metric"
              value={config.metric}
              onChange={(e) => onConfigUpdate({ metric: e.target.value as TestConfig["metric"] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="conversion">Conversion Rate</option>
              <option value="revenue">Revenue</option>
              <option value="engagement">Engagement</option>
              <option value="retention">Retention</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="statistical-method"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Statistical Method
            </label>
            <select
              id="statistical-method"
              value={config.statisticalMethod}
              onChange={(e) =>
                onConfigUpdate({ statisticalMethod: e.target.value as StatisticalMethod })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="frequentist">Frequentist</option>
              <option value="bayesian">Bayesian</option>
              <option value="sequential">Sequential</option>
              <option value="mab">Multi-Armed Bandit</option>
            </select>
          </div>
        </div>
      </div>

      {/* Variations */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Variations</h3>
          {config.testType !== "ab" && (
            <Button
              size="xs"
              variant="secondary"
              onClick={() => {
                const newVariation: Variation = {
                  id: `variant-${variations.length}`,
                  name: `Variant ${String.fromCharCode(65 + variations.length - 1)}`,
                  visitors: 0,
                  conversions: 0,
                }
                onVariationsUpdate([...variations, newVariation])
              }}
            >
              + Add Variation
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {variations.map((variation, index) => (
            <div key={variation.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  value={variation.name}
                  onChange={(e) => {
                    const updated = [...variations]
                    updated[index] = { ...variation, name: e.target.value }
                    onVariationsUpdate(updated)
                  }}
                  className="text-sm font-medium bg-transparent border-none focus:outline-none"
                />
                {index > 1 && (
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => onVariationsUpdate(variations.filter((_, i) => i !== index))}
                  >
                    Remove
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor={`visitors-${variation.id}`}
                    className="block text-xs text-gray-600 dark:text-gray-400 mb-1"
                  >
                    Visitors
                  </label>
                  <input
                    id={`visitors-${variation.id}`}
                    type="number"
                    value={variation.visitors}
                    onChange={(e) => {
                      const updated = [...variations]
                      updated[index] = { ...variation, visitors: parseInt(e.target.value) || 0 }
                      onVariationsUpdate(updated)
                    }}
                    className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                    min="0"
                  />
                </div>

                <div>
                  <label
                    htmlFor={`conversions-${variation.id}`}
                    className="block text-xs text-gray-600 dark:text-gray-400 mb-1"
                  >
                    Conversions
                  </label>
                  <input
                    id={`conversions-${variation.id}`}
                    type="number"
                    value={variation.conversions}
                    onChange={(e) => {
                      const updated = [...variations]
                      updated[index] = { ...variation, conversions: parseInt(e.target.value) || 0 }
                      onVariationsUpdate(updated)
                    }}
                    className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                    min="0"
                    max={variation.visitors}
                  />
                </div>
              </div>

              {variation.visitors > 0 && (
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Conversion Rate: {((variation.conversions / variation.visitors) * 100).toFixed(2)}
                  %
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Test Analysis Section Component
function TestAnalysisSection({
  test,
  results,
  onExport,
  onShare,
  hasData,
}: {
  test: { config: TestConfig; metadata: TestMetadata; variations: Variation[] }
  results: TestResult[] | null
  onExport: (format: "csv" | "json" | "pdf") => void
  onShare: () => void
  hasData: boolean
}) {
  const [showExportMenu, setShowExportMenu] = useState(false)

  if (!hasData) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
          No test data yet
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Enter visitor and conversion data in the Setup tab to see results.
        </p>
      </div>
    )
  }

  if (!results && test.config.statisticalMethod !== "frequentist") {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          This statistical method is not yet implemented. Try using the Frequentist method.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Export and Share controls */}
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="secondary" onClick={onShare} className="flex items-center gap-2">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.632 6.91c-.645.266-1.352.42-2.094.42-2.761 0-5-2.239-5-5s2.239-5 5-5c.742 0 1.449.154 2.094.42m-7.41 11.16L4.9 19.07a1 1 0 01-1.02-.392l-1.45-2.298a1 1 0 01.024-1.06l1.598-2.392a1 1 0 01.422-.355l2.591-1.295V6a1 1 0 011-1h2.862a1 1 0 011 1v5.278l2.591 1.295a1 1 0 01.422.355l1.598 2.392a1 1 0 01.024 1.06l-1.45 2.298a1 1 0 01-1.02.392l-3.905-.65z"
            />
          </svg>
          Share
        </Button>

        <div className="relative">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Export
          </Button>

          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    onExport("csv")
                    setShowExportMenu(false)
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Export as CSV
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onExport("json")
                    setShowExportMenu(false)
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                    />
                  </svg>
                  Export as JSON
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onExport("pdf")
                    setShowExportMenu(false)
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                  Export as PDF
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results visualization */}
      <TestResultsVisualization
        variations={test.variations}
        results={results}
        config={test.config}
      />
    </div>
  )
}

// Test Planning Section Component
function TestPlanningSection({
  config,
  variations,
}: {
  config: TestConfig
  variations: Variation[]
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
          Sample Size Calculator
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Calculate how many visitors you need to detect meaningful differences between variations.
        </p>

        <SampleSizeCalculator config={config} variations={variations} />
      </div>
    </div>
  )
}
