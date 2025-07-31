import { useCallback, useState } from "react"

interface UseWidgetRefreshOptions {
  onSuccess?: () => void
  onError?: (error: Error) => void
  cooldown?: number // Minimum time between refreshes in milliseconds
}

interface UseWidgetRefreshReturn {
  refresh: () => Promise<void>
  isRefreshing: boolean
  lastRefresh: Date | null
  error: Error | null
}

/**
 * Hook for managing widget refresh functionality
 * Provides refresh state management and cooldown handling
 */
export function useWidgetRefresh(
  refreshFn: () => Promise<void>,
  options: UseWidgetRefreshOptions = {}
): UseWidgetRefreshReturn {
  const { onSuccess, onError, cooldown = 1000 } = options

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const refresh = useCallback(async () => {
    // Check cooldown
    if (lastRefresh && cooldown > 0) {
      const timeSinceLastRefresh = Date.now() - lastRefresh.getTime()
      if (timeSinceLastRefresh < cooldown) {
        console.log(`Refresh cooldown active. Wait ${cooldown - timeSinceLastRefresh}ms`)
        return
      }
    }

    if (isRefreshing) {
      console.log("Refresh already in progress")
      return
    }

    setIsRefreshing(true)
    setError(null)

    try {
      await refreshFn()
      setLastRefresh(new Date())
      onSuccess?.()
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Refresh failed")
      setError(error)
      onError?.(error)
      console.error("Widget refresh error:", err)
    } finally {
      setIsRefreshing(false)
    }
  }, [refreshFn, isRefreshing, lastRefresh, cooldown, onSuccess, onError])

  return {
    refresh,
    isRefreshing,
    lastRefresh,
    error,
  }
}
