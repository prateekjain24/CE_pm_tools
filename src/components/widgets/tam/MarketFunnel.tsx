import { useRef, useState } from "react"
import { calculateMarketEfficiency, formatCurrency } from "~/lib/calculators/tam"
import type { Currency, MarketSizes } from "~/types"

interface MarketFunnelProps {
  values: MarketSizes
  currency: Currency
  interactive?: boolean
  showGrowth?: boolean
  visualMode?: "funnel" | "pie" | "bar"
  onSegmentClick?: (segment: "tam" | "sam" | "som") => void
  showPlaceholder?: boolean
}

interface SegmentData {
  id: "tam" | "sam" | "som"
  name: string
  fullName: string
  value: number
  percentage: number
  color: string
  description: string
}

export function MarketFunnel({
  values,
  currency,
  interactive = true,
  visualMode = "funnel",
  onSegmentClick,
  showPlaceholder = false,
}: MarketFunnelProps) {
  const { tam, sam, som } = values
  const funnelRef = useRef<HTMLDivElement>(null)
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null)
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null)

  const segments: SegmentData[] = [
    {
      id: "tam",
      name: "TAM",
      fullName: "Total Addressable Market",
      value: tam,
      percentage: 100,
      color: "#3b82f6", // blue-500
      description: "The total market demand for your product or service",
    },
    {
      id: "sam",
      name: "SAM",
      fullName: "Serviceable Addressable Market",
      value: sam,
      percentage: tam > 0 ? (sam / tam) * 100 : 0,
      color: "#10b981", // green-500
      description: "The segment of TAM targeted by your products within reach",
    },
    {
      id: "som",
      name: "SOM",
      fullName: "Serviceable Obtainable Market",
      value: som,
      percentage: tam > 0 ? (som / tam) * 100 : 0,
      color: "#8b5cf6", // purple-500
      description: "The portion of SAM you can realistically capture",
    },
  ]

  const handleSegmentClick = (segment: SegmentData) => {
    if (!interactive) return

    setSelectedSegment(segment.id)
    if (onSegmentClick) {
      onSegmentClick(segment.id)
    }
  }

  const handleExport = async (format: "png" | "svg") => {
    // Export functionality would be implemented here
    console.log(`Exporting as ${format}`)
  }

  if (tam === 0 && sam === 0 && som === 0 && !showPlaceholder) {
    return null
  }

  // Show placeholder funnel when no data
  if (showPlaceholder) {
    return (
      <div className="market-funnel space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Market Size Visualization
          </h3>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <div className="text-center py-8">
            <svg
              className="w-full h-48 opacity-30"
              viewBox="0 0 400 240"
              aria-label="Market funnel placeholder"
            >
              <title>Market funnel placeholder</title>
              <rect x="50" y="0" width="300" height="60" fill="#3b82f6" rx="4" opacity="0.3" />
              <rect x="100" y="80" width="200" height="60" fill="#10b981" rx="4" opacity="0.3" />
              <rect x="150" y="160" width="100" height="60" fill="#8b5cf6" rx="4" opacity="0.3" />
              <text x="200" y="30" textAnchor="middle" className="fill-gray-500 text-sm">
                TAM
              </text>
              <text x="200" y="110" textAnchor="middle" className="fill-gray-500 text-sm">
                SAM
              </text>
              <text x="200" y="190" textAnchor="middle" className="fill-gray-500 text-sm">
                SOM
              </text>
            </svg>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              Enter TAM value to see your market funnel visualization
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="market-funnel space-y-4">
      {/* Visualization Mode Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Market Size Visualization
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleExport("png")}
            className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            title="Export as PNG"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <title>Export as PNG</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Funnel Visualization */}
      <div ref={funnelRef} className="bg-white dark:bg-gray-800 rounded-lg p-6">
        {visualMode === "funnel" && (
          <svg
            viewBox="0 0 400 300"
            className="w-full h-64"
            role="img"
            aria-label="Market funnel visualization"
          >
            <defs>
              <linearGradient id="funnelGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#10b981" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.8" />
              </linearGradient>
            </defs>

            {segments.map((segment, index) => {
              const y = index * 90
              const width = tam > 0 ? (segment.value / tam) * 300 : 0
              const x = (400 - width) / 2

              return (
                <g key={segment.id}>
                  <rect
                    x={x}
                    y={y}
                    width={width}
                    height={70}
                    fill={segment.color}
                    fillOpacity={hoveredSegment === segment.id ? 0.9 : 0.7}
                    stroke={selectedSegment === segment.id ? "#1f2937" : "none"}
                    strokeWidth={selectedSegment === segment.id ? 2 : 0}
                    rx={4}
                    onMouseEnter={interactive ? () => setHoveredSegment(segment.id) : undefined}
                    onMouseLeave={interactive ? () => setHoveredSegment(null) : undefined}
                    onClick={interactive ? () => handleSegmentClick(segment) : undefined}
                    className={interactive ? "cursor-pointer" : ""}
                    aria-label={interactive ? segment.fullName : undefined}
                    style={{
                      transform: hoveredSegment === segment.id ? "scale(1.02)" : "scale(1)",
                      transformOrigin: "center",
                      transition: "all 0.2s ease",
                    }}
                  />

                  <text
                    x={200}
                    y={y + 25}
                    textAnchor="middle"
                    className="fill-white font-semibold text-sm pointer-events-none"
                  >
                    {segment.name}
                  </text>

                  <text
                    x={200}
                    y={y + 45}
                    textAnchor="middle"
                    className="fill-white text-xs pointer-events-none"
                  >
                    {formatCurrency(segment.value, currency)}
                  </text>

                  <text
                    x={200}
                    y={y + 60}
                    textAnchor="middle"
                    className="fill-white text-xs opacity-80 pointer-events-none"
                  >
                    {segment.percentage.toFixed(1)}%
                  </text>
                </g>
              )
            })}
          </svg>
        )}
      </div>

      {/* Segment Details */}
      {selectedSegment && (
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          {(() => {
            const segment = segments.find((s) => s.id === selectedSegment)
            if (!segment) return null

            return (
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                  {segment.fullName}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{segment.description}</p>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <span className="text-xs text-gray-500">Value</span>
                    <p className="font-semibold">{formatCurrency(segment.value, currency)}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Percentage of TAM</span>
                    <p className="font-semibold">{segment.percentage.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">SAM as % of TAM:</span>
          <span className="font-semibold">{tam > 0 ? ((sam / tam) * 100).toFixed(1) : 0}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">SOM as % of SAM:</span>
          <span className="font-semibold">{sam > 0 ? ((som / sam) * 100).toFixed(1) : 0}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">SOM as % of TAM:</span>
          <span className="font-semibold">{tam > 0 ? ((som / tam) * 100).toFixed(1) : 0}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Market Efficiency:</span>
          <span className="font-semibold">{calculateMarketEfficiency(tam, sam, som)}</span>
        </div>
      </div>

      {/* Assumptions */}
      {values.assumptions && values.assumptions.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h4 className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-2">
            Calculation Assumptions
          </h4>
          <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
            {values.assumptions.map((assumption) => (
              <li key={assumption} className="flex items-start">
                <span className="mr-2">•</span>
                <span>{assumption}</span>
              </li>
            ))}
          </ul>
          {values.confidence !== undefined && (
            <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-800">
              <span className="text-xs text-blue-700 dark:text-blue-300">
                Confidence Level: {values.confidence}%
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
