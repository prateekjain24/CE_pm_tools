import "~/styles/globals.css"
import { useState } from "react"
import { Button } from "~/components/common"
import { ToastContainer, useToast } from "~/components/common/Toast"
import { FeedStatusCard } from "~/components/popup/FeedStatusCard"
import { QuickActionCard } from "~/components/popup/QuickActionCard"
import { SearchBar } from "~/components/popup/SearchBar"
import { useCalculatorUsage } from "~/hooks/useCalculatorUsage.tsx"
import { useFeedStatus } from "~/hooks/useFeedStatus"
import { navigation } from "~/lib/navigation"
import type { CalculatorType, FeedSource } from "~/types"

export default function Popup() {
  const [searchQuery, setSearchQuery] = useState("")
  const { toasts, toast, dismissToast } = useToast()
  const { getCalculatorsByUsage, trackUsage } = useCalculatorUsage()
  const { feedStatuses, refreshFeed, refreshAllFeeds } = useFeedStatus()

  // Filter calculators based on search
  const filteredCalculators = getCalculatorsByUsage().filter(
    (calc) =>
      calc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      calc.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCalculatorClick = (calculatorId: string) => {
    trackUsage(calculatorId as CalculatorType)
    navigation.openCalculator(calculatorId)
  }

  const handleFeedRefresh = async (source: string) => {
    try {
      const response = await refreshFeed(source as FeedSource)
      if (response.success) {
        toast.success(`${source} feed refreshed successfully`)
      } else {
        toast.error(`Failed to refresh ${source} feed`)
      }
    } catch (_error) {
      toast.error(`Error refreshing ${source} feed`)
    }
  }

  const handleRefreshAll = async () => {
    try {
      const response = await refreshAllFeeds()
      if (response.success && response.data) {
        const { updated, failed } = response.data
        if (updated.length > 0) {
          toast.success(`Refreshed ${updated.length} feeds`)
        }
        if (failed.length > 0) {
          toast.warning(`Failed to refresh ${failed.length} feeds`)
        }
      }
    } catch (_error) {
      toast.error("Error refreshing feeds")
    }
  }

  return (
    <div className="popup-container">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">PM Dashboard</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Your productivity command center
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigation.openSettings()}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Settings"
          >
            <svg
              className="w-5 h-5 text-gray-600 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </div>
        <Button onClick={() => navigation.openDashboard()} fullWidth size="sm">
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
            />
          </svg>
          Open Dashboard
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {/* Search */}
        <SearchBar
          placeholder="Search calculators..."
          value={searchQuery}
          onChange={setSearchQuery}
          className="mb-4"
        />

        {/* Calculators */}
        <div className="mb-6">
          <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Quick Calculators
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {filteredCalculators.map((calc) => {
              // Map calculator shortcuts
              const shortcuts: Record<string, { key: string; ctrl?: boolean; shift?: boolean }> = {
                "rice-calculator": { key: "r", ctrl: true, shift: true },
                "tam-calculator": { key: "t", ctrl: true, shift: true },
              }

              return (
                <QuickActionCard
                  key={calc.id}
                  id={calc.id}
                  title={calc.name}
                  description={calc.description}
                  icon={calc.icon}
                  onClick={() => handleCalculatorClick(calc.id)}
                  usageCount={calc.usageCount}
                  isNew={calc.isNew}
                  isPro={calc.isPro}
                  shortcut={shortcuts[calc.id]}
                />
              )
            })}
          </div>
        </div>

        {/* Feed Status */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">Data Feeds</h2>
            <button
              type="button"
              onClick={handleRefreshAll}
              className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
            >
              Refresh All
            </button>
          </div>
          <div className="space-y-2">
            {feedStatuses.map((feed) => (
              <FeedStatusCard
                key={feed.source}
                source={feed.source}
                name={feed.name}
                lastRefreshed={feed.metadata?.lastRefreshed}
                itemCount={feed.metadata?.totalItems}
                isEnabled={feed.isEnabled}
                onRefresh={() => handleFeedRefresh(feed.source)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-700 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">PM Dashboard v0.0.1</p>
      </div>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
