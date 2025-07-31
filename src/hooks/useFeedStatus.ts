import { useStorage } from "@plasmohq/storage/hook"
import { useCallback, useEffect, useState } from "react"
import type { FeedMetadata, FeedSource } from "~/types"
import { sendMessage } from "~/types/messages"

interface FeedStatusInfo {
  source: FeedSource
  name: string
  metadata?: FeedMetadata
  isEnabled: boolean
  isRefreshing: boolean
}

const FEED_DEFINITIONS: Record<FeedSource, { name: string; defaultEnabled: boolean }> = {
  "product-hunt": {
    name: "Product Hunt",
    defaultEnabled: true,
  },
  "hacker-news": {
    name: "Hacker News",
    defaultEnabled: true,
  },
  jira: {
    name: "Jira",
    defaultEnabled: false,
  },
  rss: {
    name: "RSS Feeds",
    defaultEnabled: false,
  },
}

export function useFeedStatus() {
  const [feedMetadata, setFeedMetadata] = useStorage<Record<FeedSource, FeedMetadata>>(
    "feed-metadata",
    {}
  )
  const [userSettings] = useStorage("userSettings", {
    productHuntEnabled: true,
    hackerNewsEnabled: true,
    jiraEnabled: false,
  })
  const [refreshingFeeds, setRefreshingFeeds] = useState<Set<FeedSource>>(new Set())

  // Get all feed statuses
  const getFeedStatuses = useCallback((): FeedStatusInfo[] => {
    return Object.entries(FEED_DEFINITIONS).map(([source, def]) => {
      const feedSource = source as FeedSource
      const isEnabled =
        feedSource === "product-hunt"
          ? (userSettings.productHuntEnabled ?? true)
          : feedSource === "hacker-news"
            ? (userSettings.hackerNewsEnabled ?? true)
            : feedSource === "jira"
              ? (userSettings.jiraEnabled ?? false)
              : false

      return {
        source: feedSource,
        name: def.name,
        metadata: feedMetadata[feedSource],
        isEnabled,
        isRefreshing: refreshingFeeds.has(feedSource),
      }
    })
  }, [feedMetadata, userSettings, refreshingFeeds])

  // Refresh a single feed
  const refreshFeed = useCallback(
    async (source: FeedSource) => {
      setRefreshingFeeds((prev) => new Set(prev).add(source))

      try {
        const response = await sendMessage({
          type: "FETCH_FEED",
          feed: source,
          force: true,
        })

        if (response.success && response.data) {
          setFeedMetadata((prev) => ({
            ...prev,
            [source]: response.data.metadata,
          }))
        }

        return response
      } finally {
        setRefreshingFeeds((prev) => {
          const next = new Set(prev)
          next.delete(source)
          return next
        })
      }
    },
    [setFeedMetadata]
  )

  // Refresh all enabled feeds
  const refreshAllFeeds = useCallback(async () => {
    const statuses = getFeedStatuses()
    const enabledFeeds = statuses.filter((s) => s.isEnabled).map((s) => s.source)

    // Mark all as refreshing
    setRefreshingFeeds(new Set(enabledFeeds))

    try {
      const response = await sendMessage({ type: "REFRESH_ALL_FEEDS" })

      // Update metadata for successfully refreshed feeds
      if (response.success && response.data) {
        // Fetch updated metadata for each feed
        for (const source of response.data.updated) {
          const metaResponse = await sendMessage({
            type: "GET_FEED_METADATA",
            source,
          })
          if (metaResponse.success && metaResponse.data) {
            setFeedMetadata((prev) => ({
              ...prev,
              [source]: metaResponse.data,
            }))
          }
        }
      }

      return response
    } finally {
      setRefreshingFeeds(new Set())
    }
  }, [getFeedStatuses, setFeedMetadata])

  // Load initial metadata on mount
  useEffect(() => {
    const loadMetadata = async () => {
      const sources: FeedSource[] = ["product-hunt", "hacker-news", "jira", "rss"]
      const metadata: Record<string, FeedMetadata> = {}

      for (const source of sources) {
        try {
          const response = await sendMessage({
            type: "GET_FEED_METADATA",
            source,
          })
          if (response.success && response.data) {
            metadata[source] = response.data
          }
        } catch (error) {
          console.error(`Failed to load metadata for ${source}:`, error)
        }
      }

      setFeedMetadata(metadata)
    }

    loadMetadata()
  }, [setFeedMetadata])

  return {
    feedStatuses: getFeedStatuses(),
    refreshFeed,
    refreshAllFeeds,
    isRefreshing: refreshingFeeds.size > 0,
  }
}
