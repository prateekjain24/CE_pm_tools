import { useState } from "react"
import { Button, Card } from "~/components/common"
import { useDashboardLayout } from "~/hooks/useDashboardLayout"
import { formatBytes, getStorageQuota } from "~/lib/storage/storageManager"
import type { WidgetConfig } from "~/types"
import { BackupRestore } from "./BackupRestore"

interface DataSettingsProps {
  onLayoutRestore?: (layout: WidgetConfig[]) => void
}

export function DataSettings({ onLayoutRestore }: DataSettingsProps) {
  const { layout, setLayout, resetLayout } = useDashboardLayout()
  const [clearingData, setClearingData] = useState(false)
  const [storageInfo, setStorageInfo] = useState<{ bytesInUse: number; quota: number } | null>(null)

  // Get storage usage info
  const loadStorageInfo = async () => {
    const info = await getStorageQuota("local")
    setStorageInfo(info)
  }

  // Clear all extension data
  const handleClearAllData = async () => {
    if (
      !window.confirm(
        "Are you sure you want to clear all extension data? This will reset all settings, widgets, and saved data. This action cannot be undone."
      )
    ) {
      return
    }

    setClearingData(true)
    try {
      await chrome.storage.local.clear()
      await chrome.storage.sync.clear()
      window.location.reload()
    } catch (error) {
      console.error("Failed to clear data:", error)
    } finally {
      setClearingData(false)
    }
  }

  // Clear cached data only
  const handleClearCache = async () => {
    if (window.confirm("Clear all cached feed data? Your settings and layout will be preserved.")) {
      try {
        const keys = await chrome.storage.local.get(null)
        const cacheKeys = Object.keys(keys).filter(
          (key) => key.includes("feed-") || key.includes("cache-")
        )
        await chrome.storage.local.remove(cacheKeys)
        window.location.reload()
      } catch (error) {
        console.error("Failed to clear cache:", error)
      }
    }
  }

  React.useEffect(() => {
    loadStorageInfo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLayoutRestore = (newLayout: WidgetConfig[]) => {
    if (newLayout.length === 0) {
      resetLayout()
    } else {
      setLayout(newLayout)
    }
    onLayoutRestore?.(newLayout)
  }

  return (
    <div className="space-y-6">
      {/* Backup & Restore Section */}
      <Card
        title="Layout Management"
        description="Export, import, or reset your dashboard layout"
        className="border-0 shadow-sm"
      >
        <BackupRestore currentLayout={layout} onRestore={handleLayoutRestore} />
      </Card>

      {/* Storage Management */}
      <Card
        title="Storage Management"
        description="Manage extension data and cache"
        className="border-0 shadow-sm"
      >
        <div className="space-y-4">
          {storageInfo && (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Storage Usage</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Used</span>
                  <span className="font-medium">{formatBytes(storageInfo.bytesInUse)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Available</span>
                  <span className="font-medium">{formatBytes(storageInfo.quota)}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(storageInfo.bytesInUse / storageInfo.quota) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
            <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">Clear Cache</h4>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-4">
              Remove cached feed data to free up space. Your settings will be preserved.
            </p>
            <Button onClick={handleClearCache} variant="secondary">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-label="Clear cache"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Clear Cache
            </Button>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
            <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">Clear All Data</h4>
            <p className="text-sm text-red-700 dark:text-red-300 mb-4">
              Permanently delete all extension data including settings, layouts, and saved items.
              This action cannot be undone.
            </p>
            <Button onClick={handleClearAllData} variant="danger" disabled={clearingData}>
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-label="Warning"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              {clearingData ? "Clearing..." : "Clear All Data"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Privacy & Data */}
      <Card
        title="Privacy & Data Collection"
        description="Information about how your data is handled"
        className="border-0 shadow-sm"
      >
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start">
              <svg
                className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-label="Check"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              All data is stored locally in your browser
            </li>
            <li className="flex items-start">
              <svg
                className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-label="Check"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              API keys are encrypted before storage
            </li>
            <li className="flex items-start">
              <svg
                className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-label="Check"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              No telemetry or analytics data is collected
            </li>
            <li className="flex items-start">
              <svg
                className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-label="Check"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Settings sync only with your browser account
            </li>
          </ul>
        </div>
      </Card>
    </div>
  )
}
