import type { HackerNewsItem } from "~/types"
import { BaseWidget } from "./BaseWidget"
import { useWidgetData, useWidgetRefresh } from "./hooks"

interface HackerNewsFeedProps {
  widgetId: string
  widgetConfig?: Record<string, unknown>
}

// Mock data for now - will be replaced with real API calls
const mockHackerNewsData: HackerNewsItem[] = [
  {
    id: "1",
    title: "Show HN: AI-powered code review tool that catches bugs before production",
    url: "https://news.ycombinator.com/item?id=1",
    author: "techfounder",
    timestamp: Date.now() - 3600000,
    source: "hackernews",
    points: 342,
    commentCount: 89,
    type: "story",
  },
  {
    id: "2",
    title: "The hidden cost of microservices: A comprehensive analysis",
    url: "https://news.ycombinator.com/item?id=2",
    author: "cloudarchitect",
    timestamp: Date.now() - 7200000,
    source: "hackernews",
    points: 256,
    commentCount: 124,
    type: "story",
  },
  {
    id: "3",
    title: "Ask HN: What's your favorite productivity hack for remote work?",
    url: "https://news.ycombinator.com/item?id=3",
    author: "remoteworker",
    timestamp: Date.now() - 10800000,
    source: "hackernews",
    points: 189,
    commentCount: 234,
    type: "ask",
  },
  {
    id: "4",
    title: "PostgreSQL 16: Performance improvements that matter",
    url: "https://news.ycombinator.com/item?id=4",
    author: "dbexpert",
    timestamp: Date.now() - 14400000,
    source: "hackernews",
    points: 445,
    commentCount: 67,
    type: "story",
  },
]

export default function HackerNewsFeed({ widgetId, widgetConfig }: HackerNewsFeedProps) {
  // Simulated data fetching
  const fetchHackerNewsData = async () => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000))
    return mockHackerNewsData
  }

  const { data, loading, error, refresh } = useWidgetData(fetchHackerNewsData, {
    refreshInterval: widgetConfig?.refreshInterval
      ? widgetConfig.refreshInterval * 60 * 1000
      : undefined,
    cacheKey: `hacker-news-${widgetId}`,
  })

  const { refresh: handleRefresh, isRefreshing } = useWidgetRefresh(refresh)

  return (
    <BaseWidget
      widgetId={widgetId}
      title="Hacker News"
      data={data}
      loading={loading || isRefreshing}
      error={error}
      onRefresh={handleRefresh}
      onSettings={widgetConfig?.onSettings as () => void}
      onHide={widgetConfig?.onHide as () => void}
      settings={widgetConfig}
      emptyStateType="feed"
    >
      {(stories) => (
        <div className="p-4 space-y-4">
          {stories.map((story) => (
            <div
              key={story.id}
              className="pb-3 border-b border-gray-200 dark:border-gray-700 last:border-0 last:pb-0"
            >
              {/* Story Header */}
              <div className="flex items-start justify-between mb-1">
                <a
                  href={story.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 group"
                >
                  <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                    {story.title}
                  </h4>
                </a>
                {story.type === "show" && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded">
                    Show HN
                  </span>
                )}
                {story.type === "ask" && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 rounded">
                    Ask HN
                  </span>
                )}
              </div>

              {/* Story Metadata */}
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
                  {story.points}
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
                  {story.commentCount}
                </span>
                <span className="text-gray-400 dark:text-gray-500">by {story.author}</span>
                <span className="text-gray-400 dark:text-gray-500">
                  {getTimeAgo(story.timestamp)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </BaseWidget>
  )
}

// Helper function to format timestamps
function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)

  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
