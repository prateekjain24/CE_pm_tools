import { useState } from "react"
import type { FeedSource } from "~/types"

interface FeedStatusCardProps {
  source: FeedSource
  name: string
  lastRefreshed?: number
  itemCount?: number
  isEnabled: boolean
  onRefresh: () => Promise<void>
  className?: string
}

export function FeedStatusCard({
  source,
  name,
  lastRefreshed,
  itemCount,
  isEnabled,
  onRefresh,
  className = "",
}: FeedStatusCardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    if (isRefreshing || !isEnabled) return

    setIsRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setIsRefreshing(false)
    }
  }

  const formatLastRefreshed = (timestamp?: number) => {
    if (!timestamp) return "Never"

    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return "Just now"
  }

  const getSourceIcon = () => {
    switch (source) {
      case "product-hunt":
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M13.337 9h-2.838v3h2.838a1.501 1.501 0 100-3zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.337 10h-2.838v3H9V7h4.337a3.001 3.001 0 110 6z" />
          </svg>
        )
      case "hacker-news":
        return <span className="font-bold text-xs">HN</span>
      case "jira":
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M11.571 11.429H0a5.714 5.714 0 005.714 5.714h5.857a5.714 5.714 0 010 11.428H5.714A5.714 5.714 0 010 22.857h11.571a5.714 5.714 0 000-11.428z" />
            <path d="M24 11.429H12.429a5.714 5.714 0 01-5.714-5.714V0h5.857a5.714 5.714 0 110 11.429z" />
          </svg>
        )
      default:
        return (
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
              d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z"
            />
          </svg>
        )
    }
  }

  return (
    <div
      className={`flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg ${className}`}
    >
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-white dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-400">
          {getSourceIcon()}
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">{name}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {isEnabled ? (
              <>
                {itemCount !== undefined && `${itemCount} items • `}
                {formatLastRefreshed(lastRefreshed)}
              </>
            ) : (
              "Disabled"
            )}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleRefresh}
        disabled={!isEnabled || isRefreshing}
        className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label={`Refresh ${name} feed`}
      >
        <svg
          className={`w-4 h-4 text-gray-600 dark:text-gray-400 ${isRefreshing ? "animate-spin" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      </button>
    </div>
  )
}
