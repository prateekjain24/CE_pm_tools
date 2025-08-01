import { useMemo, useState } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/common/Tabs"
import type { TestConfig, TestResult, Variation } from "~/types"

interface TestResultsVisualizationProps {
  variations: Variation[]
  results: TestResult[] | null
  config: TestConfig
  timeSeriesData?: TimeSeriesData[]
}

interface TimeSeriesData {
  date: string
  timestamp: number
  control: {
    visitors: number
    conversions: number
    rate: number
  }
  variants: Record<
    string,
    {
      visitors: number
      conversions: number
      rate: number
      pValue?: number
      uplift?: number
    }
  >
}

export function TestResultsVisualization({
  variations,
  results,
  config,
  timeSeriesData,
}: TestResultsVisualizationProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "timeline" | "distribution" | "power">(
    "overview"
  )
  const [selectedMetric, setSelectedMetric] = useState<"rate" | "uplift" | "significance">("rate")

  // Generate sample time series data if not provided
  const chartData = useMemo(() => {
    if (timeSeriesData) return timeSeriesData

    // Generate synthetic data for visualization demo
    const days = 14
    const data: TimeSeriesData[] = []
    const baseRate = variations[0].conversions / variations[0].visitors

    for (let i = 0; i < days; i++) {
      const date = new Date()
      date.setDate(date.getDate() - (days - i - 1))

      const controlVisitors = Math.floor(variations[0].visitors / days)
      const controlConversions = Math.floor(
        controlVisitors * baseRate * (0.9 + Math.random() * 0.2)
      )

      const dataPoint: TimeSeriesData = {
        date: date.toISOString().split("T")[0],
        timestamp: date.getTime(),
        control: {
          visitors: controlVisitors,
          conversions: controlConversions,
          rate: controlConversions / controlVisitors,
        },
        variants: {},
      }

      // Add variant data
      variations.slice(1).forEach((variant, idx) => {
        const variantVisitors = Math.floor(variant.visitors / days)
        const variantRate = variant.conversions / variant.visitors
        const variantConversions = Math.floor(
          variantVisitors * variantRate * (0.9 + Math.random() * 0.2)
        )

        dataPoint.variants[variant.id] = {
          visitors: variantVisitors,
          conversions: variantConversions,
          rate: variantConversions / variantVisitors,
          uplift: ((variantConversions / variantVisitors - baseRate) / baseRate) * 100,
          pValue: results?.[idx]?.pValue,
        }
      })

      data.push(dataPoint)
    }

    return data
  }, [variations, results, timeSeriesData])

  // Prepare data for different chart types
  const conversionRateData = useMemo(() => {
    return chartData.map((point) => ({
      date: new Date(point.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      control: (point.control.rate * 100).toFixed(2),
      ...Object.entries(point.variants).reduce(
        (acc, [id, data]) => {
          acc[id] = (data.rate * 100).toFixed(2)
          return acc
        },
        {} as Record<string, string>
      ),
    }))
  }, [chartData])

  const upliftData = useMemo(() => {
    return chartData.map((point) => ({
      date: new Date(point.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      ...Object.entries(point.variants).reduce(
        (acc, [id, data]) => {
          acc[id] = data.uplift?.toFixed(2) || 0
          return acc
        },
        {} as Record<string, string | number>
      ),
    }))
  }, [chartData])

  const significanceData = useMemo(() => {
    if (!results) return []

    return chartData.map((point) => ({
      date: new Date(point.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      ...Object.entries(point.variants).reduce(
        (acc, [id, data]) => {
          acc[`${id}_pValue`] = data.pValue || 1
          acc[`${id}_significant`] = (data.pValue || 1) < 1 - config.confidenceLevel / 100 ? 1 : 0
          return acc
        },
        {} as Record<string, number>
      ),
    }))
  }, [chartData, results, config.confidenceLevel])

  // Power curve data
  const powerCurveData = useMemo(() => {
    const sampleSizes = Array.from({ length: 20 }, (_, i) => (i + 1) * 1000)
    const baseRate = variations[0].conversions / variations[0].visitors
    const effectSize = 0.2 // 20% relative effect

    return sampleSizes.map((n) => {
      // Simplified power calculation for visualization
      const se = Math.sqrt((2 * baseRate * (1 - baseRate)) / n)
      const criticalValue = 1.96 // 95% confidence
      const power = 1 - 1 / (1 + Math.exp(((effectSize * baseRate) / se - criticalValue) * 2))

      return {
        sampleSize: n,
        power: (power * 100).toFixed(1),
        current: variations[0].visitors,
      }
    })
  }, [variations])

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="power">Power Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Conversion Rate Comparison
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    ...variations.map((v) => ({
                      name: v.name,
                      rate: ((v.conversions / v.visitors) * 100).toFixed(2),
                      visitors: v.visitors,
                      conversions: v.conversions,
                    })),
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis
                    label={{ value: "Conversion Rate (%)", angle: -90, position: "insideLeft" }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length > 0) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-white dark:bg-gray-800 p-3 rounded shadow-lg border border-gray-200 dark:border-gray-700">
                            <p className="font-semibold">{data.name}</p>
                            <p className="text-sm">Rate: {data.rate}%</p>
                            <p className="text-sm">Visitors: {data.visitors.toLocaleString()}</p>
                            <p className="text-sm">
                              Conversions: {data.conversions.toLocaleString()}
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar dataKey="rate" fill="#3b82f6" />
                  {results?.some((r) => r.isSignificant) && (
                    <ReferenceLine
                      y={((variations[0].conversions / variations[0].visitors) * 100).toFixed(2)}
                      stroke="#999"
                      strokeDasharray="3 3"
                      label="Control"
                    />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {results && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Statistical Significance & Confidence Intervals
              </h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={results.map((result, idx) => ({
                      name: variations[idx + 1].name,
                      uplift: result.uplift,
                      lower: result.confidenceInterval ? result.confidenceInterval[0] * 100 : 0,
                      upper: result.confidenceInterval ? result.confidenceInterval[1] * 100 : 0,
                      significant: result.isSignificant ? result.uplift : null,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis
                      label={{ value: "Relative Uplift (%)", angle: -90, position: "insideLeft" }}
                    />
                    <Tooltip />
                    <ReferenceLine y={0} stroke="#666" />
                    <Bar dataKey="uplift" fill="#94a3b8" />
                    <Scatter dataKey="significant" fill="#10b981" />
                    {/* Error bars for confidence intervals */}
                    {results.map((_result, idx) => (
                      <ReferenceArea
                        key={`ref-area-${variations[idx + 1].id}`}
                        x1={idx - 0.4}
                        x2={idx + 0.4}
                        y1={
                          results[idx].confidenceInterval
                            ? results[idx].confidenceInterval?.[0] * 100
                            : 0
                        }
                        y2={
                          results[idx].confidenceInterval
                            ? results[idx].confidenceInterval?.[1] * 100
                            : 0
                        }
                        fill="#3b82f6"
                        fillOpacity={0.2}
                        stroke="#3b82f6"
                        strokeOpacity={0.5}
                      />
                    ))}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4 mt-4">
          <div className="flex justify-end mb-2">
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as typeof selectedMetric)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="rate">Conversion Rate</option>
              <option value="uplift">Relative Uplift</option>
              <option value="significance">Statistical Significance</option>
            </select>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              {selectedMetric === "rate" && "Conversion Rate Over Time"}
              {selectedMetric === "uplift" && "Relative Uplift Over Time"}
              {selectedMetric === "significance" && "P-Value Evolution"}
            </h4>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                {selectedMetric === "rate" && (
                  <LineChart data={conversionRateData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis
                      label={{ value: "Conversion Rate (%)", angle: -90, position: "insideLeft" }}
                    />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="control"
                      stroke="#6b7280"
                      name="Control"
                      strokeWidth={2}
                    />
                    {variations.slice(1).map((variant, idx) => (
                      <Line
                        key={variant.id}
                        type="monotone"
                        dataKey={variant.id}
                        stroke={`hsl(${210 + idx * 30}, 70%, 50%)`}
                        name={variant.name}
                        strokeWidth={2}
                      />
                    ))}
                  </LineChart>
                )}

                {selectedMetric === "uplift" && (
                  <AreaChart data={upliftData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis
                      label={{ value: "Relative Uplift (%)", angle: -90, position: "insideLeft" }}
                    />
                    <Tooltip />
                    <Legend />
                    <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
                    {variations.slice(1).map((variant, idx) => (
                      <Area
                        key={variant.id}
                        type="monotone"
                        dataKey={variant.id}
                        stroke={`hsl(${210 + idx * 30}, 70%, 50%)`}
                        fill={`hsl(${210 + idx * 30}, 70%, 50%)`}
                        fillOpacity={0.3}
                        name={variant.name}
                      />
                    ))}
                  </AreaChart>
                )}

                {selectedMetric === "significance" && (
                  <LineChart data={significanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis
                      label={{ value: "P-Value", angle: -90, position: "insideLeft" }}
                      domain={[0, 1]}
                      ticks={[0, 0.05, 0.1, 0.5, 1]}
                    />
                    <Tooltip />
                    <Legend />
                    <ReferenceLine
                      y={1 - config.confidenceLevel / 100}
                      stroke="#ef4444"
                      strokeDasharray="3 3"
                      label={`α = ${(1 - config.confidenceLevel / 100).toFixed(2)}`}
                    />
                    {variations.slice(1).map((variant, idx) => (
                      <Line
                        key={variant.id}
                        type="monotone"
                        dataKey={`${variant.id}_pValue`}
                        stroke={`hsl(${210 + idx * 30}, 70%, 50%)`}
                        name={variant.name}
                        strokeWidth={2}
                        dot={false}
                      />
                    ))}
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4 mt-4">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Conversion Rate Distribution
            </h4>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={variations.map((v, _idx) => {
                    const rate = v.conversions / v.visitors
                    const se = Math.sqrt((rate * (1 - rate)) / v.visitors)
                    return {
                      name: v.name,
                      rate: (rate * 100).toFixed(2),
                      lower: Math.max(0, (rate - 1.96 * se) * 100).toFixed(2),
                      upper: Math.min(100, (rate + 1.96 * se) * 100).toFixed(2),
                      se: (se * 100).toFixed(3),
                    }
                  })}
                  layout="horizontal"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, "dataMax"]} />
                  <YAxis dataKey="name" type="category" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length > 0) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-white dark:bg-gray-800 p-3 rounded shadow-lg border border-gray-200 dark:border-gray-700">
                            <p className="font-semibold">{data.name}</p>
                            <p className="text-sm">Rate: {data.rate}%</p>
                            <p className="text-sm">
                              95% CI: [{data.lower}%, {data.upper}%]
                            </p>
                            <p className="text-sm">SE: ±{data.se}%</p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar dataKey="rate" fill="#3b82f6" />
                  {/* Error bars visualization */}
                  {variations.map((variation, idx) => (
                    <ReferenceLine
                      key={`ref-line-${variation.id}`}
                      segment={[
                        {
                          x:
                            (variations[idx].conversions / variations[idx].visitors) * 100 -
                            1.96 *
                              Math.sqrt(
                                ((variations[idx].conversions / variations[idx].visitors) *
                                  (1 - variations[idx].conversions / variations[idx].visitors)) /
                                  variations[idx].visitors
                              ) *
                              100,
                          y: idx,
                        },
                        {
                          x:
                            (variations[idx].conversions / variations[idx].visitors) * 100 +
                            1.96 *
                              Math.sqrt(
                                ((variations[idx].conversions / variations[idx].visitors) *
                                  (1 - variations[idx].conversions / variations[idx].visitors)) /
                                  variations[idx].visitors
                              ) *
                              100,
                          y: idx,
                        },
                      ]}
                      stroke="#6b7280"
                      strokeWidth={2}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">
              Distribution Insights
            </h4>
            <div className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
              <p>• Error bars show 95% confidence intervals for each variation</p>
              <p>• Non-overlapping intervals suggest statistical significance</p>
              <p>• Wider intervals indicate more uncertainty (smaller sample sizes)</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="power" className="space-y-4 mt-4">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Statistical Power Curve
            </h4>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={powerCurveData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="sampleSize"
                    label={{
                      value: "Sample Size per Variation",
                      position: "insideBottom",
                      offset: -5,
                    }}
                  />
                  <YAxis
                    label={{ value: "Statistical Power (%)", angle: -90, position: "insideLeft" }}
                    domain={[0, 100]}
                  />
                  <Tooltip />
                  <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="3 3" label="80% Power" />
                  <ReferenceLine
                    x={variations[0].visitors}
                    stroke="#10b981"
                    strokeDasharray="3 3"
                    label="Current Sample"
                  />
                  <Line
                    type="monotone"
                    dataKey="power"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Power"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-yellow-700 dark:text-yellow-300 mb-2">
                Current Test Power
              </h4>
              <div className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">
                {results?.[0] ? `${(results[0].power * 100).toFixed(1)}%` : "N/A"}
              </div>
              <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                {results?.[0] && results[0].power < 0.8
                  ? "Consider collecting more data for reliable results"
                  : "Adequate power for detecting meaningful effects"}
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-green-700 dark:text-green-300 mb-2">
                Effect Size Detection
              </h4>
              <div className="text-2xl font-bold text-green-800 dark:text-green-200">
                {results?.[0] ? `${Math.abs(results[0].effectSize).toFixed(3)}` : "N/A"}
              </div>
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                {results?.[0] && Math.abs(results[0].effectSize) < 0.2
                  ? "Small effect size"
                  : results?.[0] && Math.abs(results[0].effectSize) < 0.5
                    ? "Medium effect size"
                    : "Large effect size"}
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
