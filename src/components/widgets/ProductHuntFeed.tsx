import type { ProductHuntItem } from "~/types"
import { BaseWidget } from "./BaseWidget"
import { useWidgetData, useWidgetRefresh } from "./hooks"

interface ProductHuntFeedProps {
  widgetId: string
  widgetConfig?: Record<string, unknown>
}

// Mock data for now - will be replaced with real API calls
const mockProductHuntData: ProductHuntItem[] = [
  {
    id: "1",
    title: "AI Code Assistant",
    url: "https://producthunt.com/posts/ai-code-assistant",
    description: "Your AI pair programmer for faster development",
    timestamp: Date.now() - 3600000,
    source: "product-hunt",
    votesCount: 245,
    commentsCount: 52,
    tagline: "Code faster with AI assistance",
    topics: ["AI", "Developer Tools", "Productivity"],
    hunters: ["john_doe"],
    makers: ["jane_smith", "bob_wilson"],
    featured: true,
  },
  {
    id: "2",
    title: "Design System Pro",
    url: "https://producthunt.com/posts/design-system-pro",
    description: "Build consistent UIs with our design system",
    timestamp: Date.now() - 7200000,
    source: "product-hunt",
    votesCount: 189,
    commentsCount: 34,
    tagline: "The ultimate design system toolkit",
    topics: ["Design", "UI/UX", "Tools"],
    hunters: ["sarah_johnson"],
    makers: ["mike_chen"],
    featured: false,
  },
  {
    id: "3",
    title: "Analytics Dashboard",
    url: "https://producthunt.com/posts/analytics-dashboard",
    description: "Real-time analytics for your SaaS",
    timestamp: Date.now() - 10800000,
    source: "product-hunt",
    votesCount: 156,
    commentsCount: 28,
    tagline: "Know your metrics, grow your business",
    topics: ["Analytics", "SaaS", "Data"],
    hunters: ["alex_williams"],
    makers: ["emma_davis", "chris_taylor"],
    featured: false,
  },
]

export default function ProductHuntFeed({ widgetId, widgetConfig }: ProductHuntFeedProps) {
  // Simulated data fetching
  const fetchProductHuntData = async () => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000))
    return mockProductHuntData
  }

  const { data, loading, error, refresh } = useWidgetData(fetchProductHuntData, {
    refreshInterval: widgetConfig?.refreshInterval
      ? widgetConfig.refreshInterval * 60 * 1000
      : undefined,
    cacheKey: `product-hunt-${widgetId}`,
  })

  const { refresh: handleRefresh, isRefreshing } = useWidgetRefresh(refresh)

  return (
    <BaseWidget
      widgetId={widgetId}
      title="Product Hunt"
      data={data}
      loading={loading || isRefreshing}
      error={error}
      onRefresh={handleRefresh}
      onSettings={widgetConfig?.onSettings as () => void}
      onHide={widgetConfig?.onHide as () => void}
      settings={widgetConfig}
      emptyStateType="feed"
    >
      {(products) => (
        <div className="p-4 space-y-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="pb-3 border-b border-gray-200 dark:border-gray-700 last:border-0 last:pb-0"
            >
              {/* Product Header */}
              <div className="flex items-start justify-between mb-1">
                <a
                  href={product.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 group"
                >
                  <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {product.title}
                  </h4>
                </a>
                {product.featured && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 rounded">
                    Featured
                  </span>
                )}
              </div>

              {/* Tagline */}
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{product.tagline}</p>

              {/* Metrics */}
              <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center">
                  <svg
                    className="w-3 h-3 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                  </svg>
                  {product.votesCount}
                </span>
                <span className="flex items-center">
                  <svg
                    className="w-3 h-3 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  {product.commentsCount}
                </span>
                <span className="flex items-center">
                  {product.topics.slice(0, 2).map((topic, i) => (
                    <span
                      key={`${product.id}-topic-${i}`}
                      className="text-gray-400 dark:text-gray-500"
                    >
                      {i > 0 && " · "}
                      {topic}
                    </span>
                  ))}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </BaseWidget>
  )
}
