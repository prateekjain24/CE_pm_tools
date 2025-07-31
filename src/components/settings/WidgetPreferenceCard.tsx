import { Badge, Input, Select, Switch } from "~/components/common"
import type { WidgetDefinition } from "~/lib/dashboard/widgetRegistry"

export interface WidgetPreference {
  enabled: boolean
  defaultVisible: boolean
  defaultSize: { width: number; height: number }
  refreshInterval?: number // in minutes
  maxItems?: number // for feed widgets
}

interface WidgetPreferenceCardProps {
  widget: WidgetDefinition
  preferences: WidgetPreference
  onChange: (preferences: WidgetPreference) => void
}

export function WidgetPreferenceCard({ widget, preferences, onChange }: WidgetPreferenceCardProps) {
  const getCategoryBadge = () => {
    const colors = {
      calculator: "blue",
      feed: "green",
      analytics: "purple",
      utility: "yellow",
    } as const

    return (
      <Badge variant={colors[widget.category] as "blue" | "green" | "purple" | "yellow"} size="sm">
        {widget.category}
      </Badge>
    )
  }

  const getWidgetIcon = () => {
    const icons = {
      calculator: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-label="Calculator"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
      ),
      feed: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-label="Feed"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
          />
        </svg>
      ),
      analytics: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-label="Analytics"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      utility: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-label="Utility"
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
      ),
    }

    return icons[widget.category] || icons.utility
  }

  const sizeOptions = []
  for (let w = widget.minSize.width; w <= widget.maxSize.width; w++) {
    for (let h = widget.minSize.height; h <= widget.maxSize.height; h++) {
      sizeOptions.push({
        value: `${w}x${h}`,
        label: `${w}×${h} grid units`,
      })
    }
  }

  const refreshOptions = [
    { value: "5", label: "5 minutes" },
    { value: "10", label: "10 minutes" },
    { value: "15", label: "15 minutes" },
    { value: "30", label: "30 minutes" },
    { value: "60", label: "1 hour" },
  ]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3">
          <div className="text-gray-600 dark:text-gray-400 mt-0.5">{getWidgetIcon()}</div>
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">{widget.name}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{widget.description}</p>
          </div>
        </div>
        {getCategoryBadge()}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Enable Widget
          </span>
          <Switch
            checked={preferences.enabled}
            onChange={(e) => onChange({ ...preferences, enabled: e.target.checked })}
          />
        </div>

        {preferences.enabled && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Show by Default
              </span>
              <Switch
                checked={preferences.defaultVisible}
                onChange={(e) => onChange({ ...preferences, defaultVisible: e.target.checked })}
              />
            </div>

            <Select
              label="Default Size"
              value={`${preferences.defaultSize.width}x${preferences.defaultSize.height}`}
              onChange={(e) => {
                const [width, height] = e.target.value.split("x").map(Number)
                onChange({ ...preferences, defaultSize: { width, height } })
              }}
              options={sizeOptions}
              className="w-48"
            />

            {widget.category === "feed" && (
              <>
                <Select
                  label="Refresh Interval"
                  value={preferences.refreshInterval?.toString() || "15"}
                  onChange={(e) =>
                    onChange({ ...preferences, refreshInterval: parseInt(e.target.value) })
                  }
                  options={refreshOptions}
                  className="w-48"
                />

                <Input
                  type="number"
                  label="Maximum Items"
                  value={preferences.maxItems || 10}
                  onChange={(e) =>
                    onChange({ ...preferences, maxItems: parseInt(e.target.value) || 10 })
                  }
                  min="1"
                  max="50"
                  className="w-32"
                  helperText="Number of items to display"
                />
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
