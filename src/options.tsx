import { useEffect, useState } from "react"

import "~/styles/globals.css"
import { Badge, Button, Card, Input, Select, Switch } from "~/components/common"
import type { UserSettings } from "~/types"
import { DEFAULT_USER_SETTINGS } from "~/types"

export default function Options() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS)
  const [saved, setSaved] = useState(false)

  // Load settings on mount
  useEffect(() => {
    chrome.storage.sync.get(["userSettings"], (result) => {
      if (result.userSettings) {
        setSettings(result.userSettings)
      }
    })
  }, [])

  const handleSave = () => {
    chrome.storage.sync.set({ userSettings: settings }, () => {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  const handleChange = (field: keyof UserSettings, value: string | number | boolean) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  const themeOptions = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark (Coming Soon)", disabled: true },
  ]

  return (
    <div className="options-container">
      <div className="max-w-3xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">PM Dashboard Settings</h1>
          <p className="text-lg text-gray-600">
            Configure your dashboard preferences and API integrations
          </p>
        </header>

        {/* General Settings */}
        <Card
          title="General Settings"
          description="Configure basic dashboard behavior"
          className="mb-6"
        >
          <div className="space-y-4">
            <Input
              label="Feed Refresh Interval (minutes)"
              type="number"
              value={settings.refreshInterval}
              onChange={(e) => handleChange("refreshInterval", parseInt(e.target.value))}
              min="5"
              max="60"
              helperText="How often to check for new feed items"
              className="w-32"
            />

            <Select
              label="Theme"
              value={settings.theme}
              onChange={(e) => handleChange("theme", e.target.value as "light" | "dark")}
              options={themeOptions}
              className="w-48"
            />
          </div>
        </Card>

        {/* Feed Settings */}
        <Card
          title="Feed Settings"
          description="Enable or disable different data sources"
          className="mb-6"
        >
          <div className="space-y-3">
            <Switch
              label="Product Hunt Feed"
              description="Show latest products and launches"
              checked={settings.productHuntEnabled}
              onChange={(e) => handleChange("productHuntEnabled", e.target.checked)}
            />

            <Switch
              label="Hacker News Feed"
              description="Display top tech news and discussions"
              checked={settings.hackerNewsEnabled}
              onChange={(e) => handleChange("hackerNewsEnabled", e.target.checked)}
            />

            <Switch
              label="Jira Integration"
              description="Connect to your Jira instance for ticket tracking"
              checked={settings.jiraEnabled}
              onChange={(e) => handleChange("jiraEnabled", e.target.checked)}
            />
          </div>
        </Card>

        {/* API Keys Section */}
        <Card
          title="API Keys"
          description="Manage third-party service integrations"
          className="mb-6"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">API Configuration</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Add your API keys to enable additional features. Keys are stored securely in
                  Chrome sync storage.
                </p>
              </div>
              <Badge variant="warning">Coming Soon</Badge>
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex items-center gap-4">
          <Button onClick={handleSave} size="lg">
            Save Settings
          </Button>

          {saved && (
            <span className="text-green-600 text-sm flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <title>Success</title>
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Settings saved successfully
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
