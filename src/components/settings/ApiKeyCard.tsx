import { useState } from "react"
import { Badge, Button, Input } from "~/components/common"
import { maskSensitiveData, validateApiKey } from "~/lib/storage/secureStorage"

export interface ApiKeyConfig {
  id: string
  name: string
  key: string
  service: "jira" | "github" | "producthunt" | "custom"
  lastTested?: number
  isValid?: boolean
  metadata?: {
    jiraEmail?: string
    jiraDomain?: string
    customUrl?: string
  }
}

interface ApiKeyCardProps {
  config: ApiKeyConfig
  showKey: boolean
  onToggleVisibility: () => void
  onTest: () => Promise<void>
  onUpdate: (updates: Partial<ApiKeyConfig>) => void
  onDelete: () => void
}

export function ApiKeyCard({
  config,
  showKey,
  onToggleVisibility,
  onTest,
  onUpdate,
  onDelete,
}: ApiKeyCardProps) {
  const [editing, setEditing] = useState(false)
  const [testing, setTesting] = useState(false)
  const [editValue, setEditValue] = useState(config.key)
  const [editMetadata, setEditMetadata] = useState(config.metadata || {})

  const handleSave = () => {
    if (validateApiKey(editValue, config.service)) {
      onUpdate({ key: editValue, metadata: editMetadata })
      setEditing(false)
    }
  }

  const handleTest = async () => {
    setTesting(true)
    try {
      await onTest()
    } finally {
      setTesting(false)
    }
  }

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete the ${config.name} API key?`)) {
      onDelete()
    }
  }

  const getServiceIcon = () => {
    switch (config.service) {
      case "github":
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-label="GitHub">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
        )
      case "jira":
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-label="Jira">
            <path d="M11.571 11.513H0l5.232-5.232a7.924 7.924 0 0 0 2.319-5.615V.046h3.02c0 3.023 2.448 5.471 5.471 5.471h3.994L14.804 10.75a7.924 7.924 0 0 0-2.319 5.614v.591c0-2.109-.825-4.157-2.319-5.615l-.595-.827zM24 11.513h-11.571l5.232 5.232a7.924 7.924 0 0 0 2.319 5.615v.62h3.02c0-3.023 2.448-5.471 5.471-5.471V11.513z" />
          </svg>
        )
      case "producthunt":
        return (
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-label="Product Hunt"
          >
            <path d="M13.604 8.4h-3.405V12h3.405a1.8 1.8 0 1 0 0-3.6zM12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm1.604 14.4h-3.405V18H7.801V6h5.804a4.2 4.2 0 1 1-.001 8.4z" />
          </svg>
        )
      default:
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-label="API Key"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
            />
          </svg>
        )
    }
  }

  const getStatusBadge = () => {
    if (config.lastTested) {
      const variant = config.isValid ? "success" : "danger"
      const text = config.isValid ? "Valid" : "Invalid"
      return <Badge variant={variant}>{text}</Badge>
    }
    return <Badge variant="secondary">Not tested</Badge>
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="text-gray-600 dark:text-gray-400">{getServiceIcon()}</div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100">{config.name}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{config.service}</p>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {editing ? (
        <div className="space-y-3">
          <Input
            type={showKey ? "text" : "password"}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder="Enter API key"
            className="font-mono text-sm"
          />

          {config.service === "jira" && (
            <>
              <Input
                type="email"
                value={editMetadata.jiraEmail || ""}
                onChange={(e) => setEditMetadata({ ...editMetadata, jiraEmail: e.target.value })}
                placeholder="Jira email address"
              />
              <Input
                type="url"
                value={editMetadata.jiraDomain || ""}
                onChange={(e) => setEditMetadata({ ...editMetadata, jiraDomain: e.target.value })}
                placeholder="https://company.atlassian.net"
              />
            </>
          )}

          {config.service === "custom" && (
            <Input
              type="url"
              value={editMetadata.customUrl || ""}
              onChange={(e) => setEditMetadata({ ...editMetadata, customUrl: e.target.value })}
              placeholder="API endpoint URL"
            />
          )}

          <div className="flex items-center space-x-2">
            <Button size="sm" onClick={handleSave}>
              Save
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">API Key:</span>
              <code className="font-mono text-sm bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                {showKey ? config.key : maskSensitiveData(config.key)}
              </code>
              <button
                type="button"
                onClick={onToggleVisibility}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                aria-label={showKey ? "Hide key" : "Show key"}
              >
                {showKey ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>

            {config.metadata?.jiraDomain && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Domain: {config.metadata.jiraDomain}
              </p>
            )}

            {config.lastTested && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Last tested: {new Date(config.lastTested).toLocaleString()}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit
            </Button>
            <Button size="sm" variant="secondary" onClick={handleTest} disabled={testing}>
              {testing ? (
                <>
                  <svg className="animate-spin w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Testing...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Test
                </>
              )}
            </Button>
            <Button size="sm" variant="danger" onClick={handleDelete}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
