import { Card, Select, Switch } from "~/components/common"
import type { UserSettings } from "~/types"

interface GeneralSettingsProps {
  settings: UserSettings
  onChange: (field: keyof UserSettings, value: string | number | boolean) => void
}

export function GeneralSettings({ settings, onChange }: GeneralSettingsProps) {
  const themeOptions = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark", disabled: false },
  ]

  const refreshOptions = [
    { value: "5", label: "5 minutes" },
    { value: "10", label: "10 minutes" },
    { value: "15", label: "15 minutes" },
    { value: "30", label: "30 minutes" },
    { value: "60", label: "60 minutes" },
  ]

  return (
    <div className="space-y-6">
      <Card
        title="Appearance"
        description="Customize how your dashboard looks"
        className="border-0 shadow-sm"
      >
        <div className="space-y-4">
          <Select
            label="Theme"
            value={settings.theme}
            onChange={(e) => onChange("theme", e.target.value as "light" | "dark")}
            options={themeOptions}
            className="w-48"
          />

          <Switch
            label="Compact Mode"
            description="Show more content in less space"
            checked={settings.compactMode || false}
            onChange={(e) => onChange("compactMode", e.target.checked)}
          />
        </div>
      </Card>

      <Card
        title="Behavior"
        description="Configure dashboard behavior and performance"
        className="border-0 shadow-sm"
      >
        <div className="space-y-4">
          <Select
            label="Feed Refresh Interval"
            value={settings.refreshInterval.toString()}
            onChange={(e) => onChange("refreshInterval", parseInt(e.target.value))}
            options={refreshOptions}
            helperText="How often to check for new feed items"
            className="w-48"
          />

          <Switch
            label="Show Notifications"
            description="Display browser notifications for important updates"
            checked={settings.showNotifications || true}
            onChange={(e) => onChange("showNotifications", e.target.checked)}
          />

          <Switch
            label="Default New Tab"
            description="Set PM Dashboard as your default new tab page"
            checked={settings.defaultNewTab || true}
            onChange={(e) => onChange("defaultNewTab", e.target.checked)}
          />
        </div>
      </Card>

      <Card
        title="Feed Sources"
        description="Enable or disable different data sources"
        className="border-0 shadow-sm"
      >
        <div className="space-y-3">
          <Switch
            label="Product Hunt Feed"
            description="Show latest products and launches"
            checked={settings.productHuntEnabled}
            onChange={(e) => onChange("productHuntEnabled", e.target.checked)}
          />

          <Switch
            label="Hacker News Feed"
            description="Display top tech news and discussions"
            checked={settings.hackerNewsEnabled}
            onChange={(e) => onChange("hackerNewsEnabled", e.target.checked)}
          />

          <Switch
            label="Jira Integration"
            description="Connect to your Jira instance for ticket tracking"
            checked={settings.jiraEnabled}
            onChange={(e) => onChange("jiraEnabled", e.target.checked)}
          />

          <Switch
            label="RSS Feeds"
            description="Enable custom RSS feed subscriptions"
            checked={settings.rssEnabled || false}
            onChange={(e) => onChange("rssEnabled", e.target.checked)}
          />
        </div>
      </Card>
    </div>
  )
}
