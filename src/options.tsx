import { useEffect, useState } from "react"

import "~/styles/globals.css"

export default function Options() {
  const [settings, setSettings] = useState({
    refreshInterval: 15,
    theme: "light",
    productHuntEnabled: true,
    hackerNewsEnabled: true,
    jiraEnabled: false,
  })

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

  const handleChange = (field: string, value: string | number | boolean) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="options-container">
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <h1>PM Dashboard Settings</h1>
        <p style={{ marginBottom: "2rem", color: "#6b7280" }}>
          Configure your dashboard preferences and API integrations
        </p>

        {/* General Settings */}
        <section
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "0.5rem",
            padding: "1.5rem",
            marginBottom: "1.5rem",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          }}
        >
          <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>General Settings</h2>

          <div style={{ marginBottom: "1rem" }}>
            <label
              htmlFor="refresh-interval"
              style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}
            >
              Feed Refresh Interval (minutes)
            </label>
            <input
              id="refresh-interval"
              type="number"
              value={settings.refreshInterval}
              onChange={(e) => handleChange("refreshInterval", parseInt(e.target.value))}
              min="5"
              max="60"
              style={{
                padding: "0.5rem",
                border: "1px solid #e5e7eb",
                borderRadius: "0.375rem",
                width: "120px",
              }}
            />
          </div>

          <div>
            <label
              htmlFor="theme-select"
              style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}
            >
              Theme
            </label>
            <select
              id="theme-select"
              value={settings.theme}
              onChange={(e) => handleChange("theme", e.target.value)}
              style={{
                padding: "0.5rem",
                border: "1px solid #e5e7eb",
                borderRadius: "0.375rem",
                width: "200px",
              }}
            >
              <option value="light">Light</option>
              <option value="dark">Dark (Coming Soon)</option>
            </select>
          </div>
        </section>

        {/* Feed Settings */}
        <section
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "0.5rem",
            padding: "1.5rem",
            marginBottom: "1.5rem",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          }}
        >
          <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>Feed Settings</h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={settings.productHuntEnabled}
                onChange={(e) => handleChange("productHuntEnabled", e.target.checked)}
                style={{ marginRight: "0.5rem" }}
              />
              <span>Enable Product Hunt Feed</span>
            </label>

            <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={settings.hackerNewsEnabled}
                onChange={(e) => handleChange("hackerNewsEnabled", e.target.checked)}
                style={{ marginRight: "0.5rem" }}
              />
              <span>Enable Hacker News Feed</span>
            </label>

            <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={settings.jiraEnabled}
                onChange={(e) => handleChange("jiraEnabled", e.target.checked)}
                style={{ marginRight: "0.5rem" }}
              />
              <span>Enable Jira Integration</span>
            </label>
          </div>
        </section>

        {/* API Keys Section */}
        <section
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "0.5rem",
            padding: "1.5rem",
            marginBottom: "1.5rem",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          }}
        >
          <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>API Keys</h2>
          <p style={{ marginBottom: "1rem", fontSize: "0.875rem", color: "#6b7280" }}>
            Add your API keys to enable additional features. Keys are stored securely in Chrome sync
            storage.
          </p>

          <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>
            API key configuration will be available in future updates.
          </div>
        </section>

        {/* Save Button */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            type="button"
            onClick={handleSave}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "#0066cc",
              color: "white",
              border: "none",
              borderRadius: "0.375rem",
              fontSize: "1rem",
              fontWeight: "500",
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#0052a3"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#0066cc"
            }}
          >
            Save Settings
          </button>

          {saved && (
            <span style={{ color: "#10b981", fontSize: "0.875rem" }}>
              ✓ Settings saved successfully
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
