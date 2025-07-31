import { useCallback, useEffect, useState } from "react"

interface UseWidgetDataOptions {
  refreshInterval?: number // in milliseconds
  enabled?: boolean
  cacheKey?: string
}

interface UseWidgetDataReturn<T> {
  data: T | undefined
  loading: boolean
  error: Error | null
  refresh: () => Promise<void>
}

/**
 * Hook for fetching and managing widget data
 * Handles loading states, errors, and automatic refresh
 */
export function useWidgetData<T = unknown>(
  fetchFn: () => Promise<T>,
  options: UseWidgetDataOptions = {}
): UseWidgetDataReturn<T> {
  const { refreshInterval, enabled = true, cacheKey } = options

  const [data, setData] = useState<T | undefined>(() => {
    // Try to get cached data if cacheKey is provided
    if (cacheKey) {
      const cached = sessionStorage.getItem(`widget-data-${cacheKey}`)
      if (cached) {
        try {
          return JSON.parse(cached)
        } catch {
          // Invalid cache, ignore
        }
      }
    }
    return undefined
  })

  const [loading, setLoading] = useState(!data) // Don't show loading if we have cached data
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(async () => {
    if (!enabled) return

    setLoading(true)
    setError(null)

    try {
      const result = await fetchFn()
      setData(result)

      // Cache the data if cacheKey is provided
      if (cacheKey) {
        try {
          sessionStorage.setItem(`widget-data-${cacheKey}`, JSON.stringify(result))
        } catch {
          // Storage might be full, ignore
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch data"))
      console.error("Widget data fetch error:", err)
    } finally {
      setLoading(false)
    }
  }, [enabled, fetchFn, cacheKey])

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchData()
    }
  }, [enabled, fetchData])

  // Setup refresh interval if provided
  useEffect(() => {
    if (!refreshInterval || !enabled) return

    const interval = setInterval(fetchData, refreshInterval)
    return () => clearInterval(interval)
  }, [refreshInterval, enabled, fetchData])

  return {
    data,
    loading,
    error,
    refresh: fetchData,
  }
}
