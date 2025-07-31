import { useStorage } from "@plasmohq/storage/hook"
import { useEffect, useState } from "react"

import "~/styles/globals.css"
import { Button, Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/common"
import { ApiKeyManager } from "~/components/settings/ApiKeyManager"
import { DataSettings } from "~/components/settings/DataSettings"
import { GeneralSettings } from "~/components/settings/GeneralSettings"
import { WidgetPreferences } from "~/components/settings/WidgetPreferences"
import type { UserSettings } from "~/types"
import { DEFAULT_USER_SETTINGS } from "~/types"

export default function Options() {
  const [settings, setSettings] = useStorage<UserSettings>("userSettings", DEFAULT_USER_SETTINGS)
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.slice(1)
    return hash || "general"
  })
  const [saved, setSaved] = useState(false)

  // Update URL hash when tab changes
  useEffect(() => {
    window.location.hash = activeTab
  }, [activeTab])

  // Listen for hash changes (e.g., from back/forward navigation)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1)
      if (hash) {
        setActiveTab(hash)
      }
    }

    window.addEventListener("hashchange", handleHashChange)
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [])

  const handleSave = async () => {
    // Settings are automatically saved by useStorage hook
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleSettingChange = (field: keyof UserSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                PM Dashboard Settings
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Configure your dashboard preferences and integrations
              </p>
            </div>
            <div className="flex items-center gap-4">
              {saved && (
                <span className="text-green-600 dark:text-green-400 text-sm flex items-center animate-fade-in">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Settings saved
                </span>
              )}
              <Button onClick={handleSave} size="lg">
                Save All Settings
              </Button>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="general">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              General
            </TabsTrigger>
            <TabsTrigger value="api-keys">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
              API Keys
            </TabsTrigger>
            <TabsTrigger value="widgets">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                />
              </svg>
              Widgets
            </TabsTrigger>
            <TabsTrigger value="data">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                />
              </svg>
              Data
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <GeneralSettings settings={settings} onChange={handleSettingChange} />
          </TabsContent>

          <TabsContent value="api-keys">
            <ApiKeyManager />
          </TabsContent>

          <TabsContent value="widgets">
            <WidgetPreferences />
          </TabsContent>

          <TabsContent value="data">
            <DataSettings />
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <p>PM Dashboard v{chrome.runtime.getManifest().version}</p>
            <div className="flex items-center space-x-4">
              <a
                href="#"
                className="hover:text-gray-700 dark:hover:text-gray-300"
                onClick={(e) => {
                  e.preventDefault()
                  chrome.tabs.create({ url: "https://github.com/yourusername/pm-dashboard" })
                }}
              >
                GitHub
              </a>
              <a
                href="#"
                className="hover:text-gray-700 dark:hover:text-gray-300"
                onClick={(e) => {
                  e.preventDefault()
                  chrome.tabs.create({ url: "https://github.com/yourusername/pm-dashboard/issues" })
                }}
              >
                Report Issue
              </a>
              <a
                href="#"
                className="hover:text-gray-700 dark:hover:text-gray-300"
                onClick={(e) => {
                  e.preventDefault()
                  chrome.tabs.create({ url: chrome.runtime.getURL("tabs/newtab.html") })
                }}
              >
                View Dashboard
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
