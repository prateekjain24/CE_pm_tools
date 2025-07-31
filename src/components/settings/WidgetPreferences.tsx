import { useStorage } from "@plasmohq/storage/hook"
import { useState } from "react"
import { Button, Card } from "~/components/common"
import { getWidgetCategories, widgetRegistry } from "~/lib/dashboard/widgetRegistry"
import { type WidgetPreference, WidgetPreferenceCard } from "./WidgetPreferenceCard"

type WidgetPreferences = Record<string, WidgetPreference>

const DEFAULT_PREFERENCES: WidgetPreference = {
  enabled: true,
  defaultVisible: true,
  defaultSize: { width: 4, height: 3 },
  refreshInterval: 15,
  maxItems: 10,
}

export function WidgetPreferences() {
  const [preferences, setPreferences] = useStorage<WidgetPreferences>("widget-preferences", {})
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const categories = getWidgetCategories()

  const handlePreferenceChange = (widgetId: string, newPrefs: WidgetPreference) => {
    setPreferences((prev) => ({
      ...prev,
      [widgetId]: newPrefs,
    }))
  }

  const handleResetAll = () => {
    if (
      window.confirm(
        "Are you sure you want to reset all widget preferences to defaults? This cannot be undone."
      )
    ) {
      setPreferences({})
    }
  }

  const handleEnableAll = (enable: boolean) => {
    const newPrefs: WidgetPreferences = {}
    Array.from(widgetRegistry.keys()).forEach((widgetId) => {
      const current = preferences[widgetId] || DEFAULT_PREFERENCES
      newPrefs[widgetId] = { ...current, enabled: enable }
    })
    setPreferences(newPrefs)
  }

  const getWidgetPreference = (widgetId: string): WidgetPreference => {
    const widget = widgetRegistry.get(widgetId)
    if (!widget) return DEFAULT_PREFERENCES

    return (
      preferences[widgetId] || {
        ...DEFAULT_PREFERENCES,
        defaultSize: widget.defaultSize,
      }
    )
  }

  const filteredWidgets = activeCategory
    ? Array.from(widgetRegistry.values()).filter((w) => w.category === activeCategory)
    : Array.from(widgetRegistry.values())

  const enabledCount = Array.from(widgetRegistry.keys()).filter(
    (id) => (preferences[id] || DEFAULT_PREFERENCES).enabled
  ).length

  return (
    <div className="space-y-6">
      <Card
        title="Widget Library"
        description="Configure default settings for all available widgets"
        className="border-0 shadow-sm"
        action={
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {enabledCount} of {widgetRegistry.size} enabled
            </span>
            <Button size="sm" variant="secondary" onClick={handleResetAll}>
              Reset All
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Category Filter */}
          <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter:</span>
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                activeCategory === null
                  ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              All ({widgetRegistry.size})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  activeCategory === cat.id
                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                {cat.name} ({cat.count})
              </button>
            ))}
          </div>

          {/* Bulk Actions */}
          <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <span className="text-sm text-yellow-800 dark:text-yellow-200">Bulk Actions</span>
            <div className="space-x-2">
              <Button size="sm" variant="secondary" onClick={() => handleEnableAll(true)}>
                Enable All
              </Button>
              <Button size="sm" variant="secondary" onClick={() => handleEnableAll(false)}>
                Disable All
              </Button>
            </div>
          </div>

          {/* Widget List */}
          <div className="space-y-4">
            {filteredWidgets.map((widget) => (
              <WidgetPreferenceCard
                key={widget.id}
                widget={widget}
                preferences={getWidgetPreference(widget.id)}
                onChange={(prefs) => handlePreferenceChange(widget.id, prefs)}
              />
            ))}
          </div>
        </div>
      </Card>

      <Card
        title="Widget Behavior"
        description="Global settings that apply to all widgets"
        className="border-0 shadow-sm"
      >
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
              Performance Settings
            </h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center">
                <svg
                  className="w-4 h-4 mr-2 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-label="Performance"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Widgets load on-demand to improve performance
              </li>
              <li className="flex items-center">
                <svg
                  className="w-4 h-4 mr-2 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-label="Performance"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Feed widgets refresh based on individual settings
              </li>
              <li className="flex items-center">
                <svg
                  className="w-4 h-4 mr-2 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-label="Performance"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                Error boundaries prevent widget crashes from affecting others
              </li>
            </ul>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Tips</h4>
            <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
              <li>• Disable widgets you don't use to save resources</li>
              <li>• Adjust refresh intervals based on how often you need updates</li>
              <li>• Larger widget sizes show more information but use more space</li>
              <li>• Changes here affect new widgets only; existing ones keep their settings</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}
