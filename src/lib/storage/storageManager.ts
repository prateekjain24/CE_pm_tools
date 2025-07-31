import {
  estimateStorageSize,
  isQuotaExceeded,
  STORAGE_CONFIG,
  type StorageKey,
} from "~/types/storage"

/**
 * Storage quota information
 */
export interface StorageQuotaInfo {
  bytesInUse: number
  quota: number
  percentUsed: number
  availableBytes: number
}

/**
 * Storage usage details by key
 */
export interface StorageUsageDetails {
  totalBytes: number
  byKey: Record<string, number>
  quotaInfo: {
    sync: StorageQuotaInfo
    local: StorageQuotaInfo
  }
}

/**
 * Get storage quota information
 */
export async function getStorageQuota(area: "sync" | "local"): Promise<StorageQuotaInfo> {
  return new Promise((resolve) => {
    const storageArea = area === "sync" ? chrome.storage.sync : chrome.storage.local

    // Get bytes in use
    storageArea.getBytesInUse(null, (bytesInUse) => {
      // Get quota - sync has fixed quota, local can vary
      const quota =
        area === "sync" ? chrome.storage.sync.QUOTA_BYTES : chrome.storage.local.QUOTA_BYTES

      const percentUsed = (bytesInUse / quota) * 100
      const availableBytes = quota - bytesInUse

      resolve({
        bytesInUse,
        quota,
        percentUsed: Math.round(percentUsed * 100) / 100,
        availableBytes,
      })
    })
  })
}

/**
 * Get detailed storage usage
 */
export async function getStorageUsageDetails(): Promise<StorageUsageDetails> {
  const syncQuota = await getStorageQuota("sync")
  const localQuota = await getStorageQuota("local")

  // Get all stored data to calculate individual sizes
  const syncData = await chrome.storage.sync.get(null)
  const localData = await chrome.storage.local.get(null)

  const byKey: Record<string, number> = {}

  // Calculate size for each key
  for (const [key, value] of Object.entries({ ...syncData, ...localData })) {
    byKey[key] = estimateStorageSize(value)
  }

  const totalBytes = Object.values(byKey).reduce((sum, size) => sum + size, 0)

  return {
    totalBytes,
    byKey,
    quotaInfo: {
      sync: syncQuota,
      local: localQuota,
    },
  }
}

/**
 * Check if storage has enough space for data
 */
export async function hasStorageSpace(
  key: StorageKey,
  data: unknown
): Promise<{ hasSpace: boolean; reason?: string }> {
  const config = STORAGE_CONFIG[key]
  const size = estimateStorageSize(data)

  // Check against per-key quota
  if (isQuotaExceeded(key, data)) {
    return {
      hasSpace: false,
      reason: `Data size (${formatBytes(size)}) exceeds key quota (${formatBytes(
        config.quota || 0
      )})`,
    }
  }

  // Check against storage area quota
  const area = config.area === "sync" ? "sync" : "local"
  const quotaInfo = await getStorageQuota(area)

  if (size > quotaInfo.availableBytes) {
    return {
      hasSpace: false,
      reason: `Not enough space in ${area} storage. Available: ${formatBytes(
        quotaInfo.availableBytes
      )}, Required: ${formatBytes(size)}`,
    }
  }

  return { hasSpace: true }
}

/**
 * Clear old/unused data to free up space
 */
export async function performStorageCleanup(): Promise<{
  freedBytes: number
  removedKeys: string[]
}> {
  const removedKeys: string[] = []
  let freedBytes = 0

  // Clear old cache timestamps
  const cacheTimestamps =
    (await chrome.storage.local.get("cache-timestamps"))["cache-timestamps"] || {}
  const now = Date.now()
  const maxAge = 7 * 24 * 60 * 60 * 1000 // 7 days

  const updatedTimestamps: Record<string, number> = {}
  for (const [key, timestamp] of Object.entries(cacheTimestamps)) {
    if (now - timestamp > maxAge) {
      removedKeys.push(key)
    } else {
      updatedTimestamps[key] = timestamp
    }
  }

  if (removedKeys.length > 0) {
    const oldSize = estimateStorageSize(cacheTimestamps)
    const newSize = estimateStorageSize(updatedTimestamps)
    freedBytes += oldSize - newSize
    await chrome.storage.local.set({ "cache-timestamps": updatedTimestamps })
  }

  // Clear old calculator history (keep last 100 entries per type)
  const history = (await chrome.storage.local.get("calculator-history"))["calculator-history"]
  if (history) {
    const updatedHistory = { ...history }
    let historyChanged = false

    for (const [type, entries] of Object.entries(history)) {
      if (Array.isArray(entries) && entries.length > 100) {
        const oldSize = estimateStorageSize(entries)
        updatedHistory[type] = entries.slice(-100)
        const newSize = estimateStorageSize(updatedHistory[type])
        freedBytes += oldSize - newSize
        historyChanged = true
      }
    }

    if (historyChanged) {
      await chrome.storage.local.set({ "calculator-history": updatedHistory })
    }
  }

  return { freedBytes, removedKeys }
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
}

/**
 * Monitor storage usage and warn when approaching limits
 */
export class StorageMonitor {
  private warningThreshold = 80 // Warn at 80% usage
  private criticalThreshold = 95 // Critical at 95% usage

  async checkStorageHealth(): Promise<{
    sync: "healthy" | "warning" | "critical"
    local: "healthy" | "warning" | "critical"
    message?: string
  }> {
    const syncQuota = await getStorageQuota("sync")
    const localQuota = await getStorageQuota("local")

    const syncStatus = this.getStatus(syncQuota.percentUsed)
    const localStatus = this.getStatus(localQuota.percentUsed)

    let message: string | undefined

    if (syncStatus === "critical" || localStatus === "critical") {
      message = "Storage is critically low. Please clean up unused data."
    } else if (syncStatus === "warning" || localStatus === "warning") {
      message = "Storage usage is high. Consider cleaning up old data."
    }

    return {
      sync: syncStatus,
      local: localStatus,
      message,
    }
  }

  private getStatus(percentUsed: number): "healthy" | "warning" | "critical" {
    if (percentUsed >= this.criticalThreshold) return "critical"
    if (percentUsed >= this.warningThreshold) return "warning"
    return "healthy"
  }

  /**
   * Set up automatic monitoring
   */
  startMonitoring(callback: (status: Awaited<ReturnType<typeof this.checkStorageHealth>>) => void) {
    // Check immediately
    this.checkStorageHealth().then(callback)

    // Check every 5 minutes
    const intervalId = setInterval(
      async () => {
        const status = await this.checkStorageHealth()
        callback(status)
      },
      5 * 60 * 1000
    )

    // Return cleanup function
    return () => clearInterval(intervalId)
  }
}
