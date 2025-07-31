import { useEffect, useState } from "react"
import { Button, Card, Input, Modal, Select } from "~/components/common"
import { useSecureStorage } from "~/hooks/useSecureStorage"
import { validateApiKey } from "~/lib/storage/secureStorage"
import { sendMessage } from "~/types/messages"
import { ApiKeyCard, type ApiKeyConfig } from "./ApiKeyCard"

const SERVICE_OPTIONS = [
  { value: "github", label: "GitHub" },
  { value: "jira", label: "Jira" },
  { value: "producthunt", label: "Product Hunt" },
  { value: "custom", label: "Custom API" },
]

export function ApiKeyManager() {
  const [keys, setKeys] = useSecureStorage<ApiKeyConfig[]>("api-keys", [])
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [newKey, setNewKey] = useState<Partial<ApiKeyConfig>>({
    service: "github",
    name: "GitHub API",
  })
  const [widgetUsage, setWidgetUsage] = useState<Record<string, string[]>>({})

  // Load widget usage data
  useEffect(() => {
    loadWidgetUsage()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadWidgetUsage = async () => {
    // This would typically load from widget configurations
    // For now, we'll use a static mapping
    const usage: Record<string, string[]> = {
      github: ["GitHub Issues Widget", "Repository Stats"],
      jira: ["Jira Tickets Feed", "Sprint Dashboard"],
      producthunt: ["Product Hunt Feed"],
    }
    setWidgetUsage(usage)
  }

  const handleAddKey = async () => {
    if (!newKey.name || !newKey.key || !newKey.service) return

    if (!validateApiKey(newKey.key, newKey.service)) {
      alert(`Invalid API key format for ${newKey.service}`)
      return
    }

    const keyConfig: ApiKeyConfig = {
      id: `${newKey.service}-${Date.now()}`,
      name: newKey.name,
      key: newKey.key,
      service: newKey.service as ApiKeyConfig["service"],
      metadata: newKey.metadata,
    }

    await setKeys([...keys, keyConfig])
    setAddModalOpen(false)
    setNewKey({ service: "github", name: "GitHub API" })
  }

  const handleUpdateKey = async (id: string, updates: Partial<ApiKeyConfig>) => {
    await setKeys(keys.map((key) => (key.id === id ? { ...key, ...updates } : key)))
  }

  const handleDeleteKey = async (id: string) => {
    await setKeys(keys.filter((key) => key.id !== id))
    const newShowKeys = { ...showKeys }
    delete newShowKeys[id]
    setShowKeys(newShowKeys)
  }

  const handleTestConnection = async (keyConfig: ApiKeyConfig) => {
    try {
      const result = await sendMessage({
        type: "TEST_API_CONNECTION",
        service: keyConfig.service,
        key: keyConfig.key,
        metadata: keyConfig.metadata,
      })

      await handleUpdateKey(keyConfig.id, {
        isValid: result.data?.isValid || false,
        lastTested: Date.now(),
      })

      if (!result.success || !result.data?.isValid) {
        alert(`Connection test failed: ${result.data?.message || result.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error("Failed to test connection:", error)
      alert("Failed to test connection. Please check the console for details.")
    }
  }

  const toggleKeyVisibility = (id: string) => {
    setShowKeys((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const getServiceName = (service: string) => {
    const option = SERVICE_OPTIONS.find((opt) => opt.value === service)
    return option?.label || service
  }

  const updateNewKeyForService = (service: string) => {
    const names: Record<string, string> = {
      github: "GitHub API",
      jira: "Jira API",
      producthunt: "Product Hunt API",
      custom: "Custom API",
    }
    setNewKey((prev) => ({ ...prev, service, name: names[service] || "API Key" }))
  }

  return (
    <div className="space-y-6">
      <Card
        title="API Keys"
        description="Manage API keys for third-party integrations"
        className="border-0 shadow-sm"
        action={
          <Button size="sm" onClick={() => setAddModalOpen(true)}>
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Key
          </Button>
        }
      >
        {keys.length === 0 ? (
          <div className="text-center py-8">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              No API keys
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Add API keys to enable third-party integrations.
            </p>
            <div className="mt-6">
              <Button onClick={() => setAddModalOpen(true)}>
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add your first key
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {keys.map((keyConfig) => (
              <div key={keyConfig.id}>
                <ApiKeyCard
                  config={keyConfig}
                  showKey={showKeys[keyConfig.id] || false}
                  onToggleVisibility={() => toggleKeyVisibility(keyConfig.id)}
                  onTest={() => handleTestConnection(keyConfig)}
                  onUpdate={(updates) => handleUpdateKey(keyConfig.id, updates)}
                  onDelete={() => handleDeleteKey(keyConfig.id)}
                />
                {widgetUsage[keyConfig.service] && widgetUsage[keyConfig.service].length > 0 && (
                  <div className="mt-2 px-4 text-xs text-gray-500 dark:text-gray-400">
                    Used by: {widgetUsage[keyConfig.service].join(", ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card
        title="Security Information"
        description="How your API keys are protected"
        className="border-0 shadow-sm bg-blue-50 dark:bg-blue-900/20"
      >
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li className="flex items-start">
            <svg
              className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Keys are encrypted before storage
          </li>
          <li className="flex items-start">
            <svg
              className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z"
                clipRule="evenodd"
              />
            </svg>
            Keys are stored locally in your browser
          </li>
          <li className="flex items-start">
            <svg
              className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
            Keys are only accessible by this extension
          </li>
        </ul>
      </Card>

      {/* Add Key Modal */}
      <Modal open={addModalOpen} onClose={() => setAddModalOpen(false)}>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Add API Key
          </h2>
          <div className="space-y-4">
            <Select
              label="Service"
              value={newKey.service || "github"}
              onChange={(e) => updateNewKeyForService(e.target.value)}
              options={SERVICE_OPTIONS}
            />

            <Input
              label="Name"
              value={newKey.name || ""}
              onChange={(e) => setNewKey({ ...newKey, name: e.target.value })}
              placeholder="e.g., Production API Key"
            />

            <Input
              label="API Key"
              type="password"
              value={newKey.key || ""}
              onChange={(e) => setNewKey({ ...newKey, key: e.target.value })}
              placeholder="Enter your API key"
              className="font-mono"
            />

            {newKey.service === "jira" && (
              <>
                <Input
                  label="Email"
                  type="email"
                  value={newKey.metadata?.jiraEmail || ""}
                  onChange={(e) =>
                    setNewKey({
                      ...newKey,
                      metadata: { ...newKey.metadata, jiraEmail: e.target.value },
                    })
                  }
                  placeholder="your-email@company.com"
                />
                <Input
                  label="Domain"
                  type="url"
                  value={newKey.metadata?.jiraDomain || ""}
                  onChange={(e) =>
                    setNewKey({
                      ...newKey,
                      metadata: { ...newKey.metadata, jiraDomain: e.target.value },
                    })
                  }
                  placeholder="https://company.atlassian.net"
                />
              </>
            )}

            {newKey.service === "custom" && (
              <Input
                label="API Endpoint"
                type="url"
                value={newKey.metadata?.customUrl || ""}
                onChange={(e) =>
                  setNewKey({
                    ...newKey,
                    metadata: { ...newKey.metadata, customUrl: e.target.value },
                  })
                }
                placeholder="https://api.example.com"
              />
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="secondary" onClick={() => setAddModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddKey}
                disabled={!newKey.name || !newKey.key || !newKey.service}
              >
                Add Key
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
